/**
 * DB-backed rate limiter using the `login_attempts` table.
 *
 * Works across serverless instances because PostgreSQL is the shared state store.
 * Uses a fixed sliding window: attempts are counted from `window_start` until
 * the window duration elapses, then the counter resets on the next request.
 *
 * Usage:
 *   const result = await checkRateLimit(ip, 'admin');
 *   if (!result.allowed) return rateLimitResponse(result.retryAfter);
 *   // ... auth logic ...
 *   if (loginSuccess) await resetRateLimit(ip, 'admin');
 */

import { db } from '@/lib/db';
import { loginAttempts } from '@shared/schema';
import { and, eq, sql } from 'drizzle-orm';

export type RateLimitEndpoint = 'admin' | 'customer';

// Configuration per endpoint
const LIMITS: Record<RateLimitEndpoint, { maxAttempts: number; windowSeconds: number }> = {
  admin:    { maxAttempts: 5,  windowSeconds: 15 * 60 }, // 5 per 15 min
  customer: { maxAttempts: 10, windowSeconds: 15 * 60 }, // 10 per 15 min
};

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  retryAfter?: number; // seconds until window resets
}

/**
 * Check if the IP is within the rate limit for the given endpoint.
 * Increments the counter and returns whether the request is allowed.
 */
export async function checkRateLimit(
  ip: string,
  endpoint: RateLimitEndpoint
): Promise<RateLimitResult> {
  const { maxAttempts, windowSeconds } = LIMITS[endpoint];
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    // Find existing record for this IP + endpoint
    const [existing] = await db
      .select()
      .from(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.endpoint, endpoint)));

    if (!existing) {
      // First attempt — create the record
      await db.insert(loginAttempts).values({
        ip,
        endpoint,
        attemptCount: 1,
        windowStart: now,
        lastAttemptAt: now,
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Check if the current window has expired
    const windowExpired = existing.windowStart < windowStart;

    if (windowExpired) {
      // Reset window and count this as the first attempt
      await db
        .update(loginAttempts)
        .set({ attemptCount: 1, windowStart: now, lastAttemptAt: now })
        .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.endpoint, endpoint)));
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Window still active — increment counter
    const newCount = existing.attemptCount + 1;
    await db
      .update(loginAttempts)
      .set({ attemptCount: newCount, lastAttemptAt: now })
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.endpoint, endpoint)));

    if (newCount > maxAttempts) {
      // Over limit — compute seconds until window resets
      const windowEndsAt = new Date(existing.windowStart.getTime() + windowSeconds * 1000);
      const retryAfter = Math.ceil((windowEndsAt.getTime() - now.getTime()) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfter: Math.max(retryAfter, 1) };
    }

    return { allowed: true, remainingAttempts: maxAttempts - newCount };
  } catch (err) {
    // Rate limiting is a defense layer; never let a DB error block logins entirely
    console.error('rate-limit: DB error (allowing request through):', err);
    return { allowed: true, remainingAttempts: maxAttempts };
  }
}

/**
 * Reset the rate limit counter after a successful login.
 * Call this only when authentication succeeds.
 */
export async function resetRateLimit(
  ip: string,
  endpoint: RateLimitEndpoint
): Promise<void> {
  try {
    await db
      .delete(loginAttempts)
      .where(and(eq(loginAttempts.ip, ip), eq(loginAttempts.endpoint, endpoint)));
  } catch (err) {
    // Non-critical — log and move on
    console.error('rate-limit: failed to reset counter:', err);
  }
}

/**
 * Extract the real client IP from a Next.js request.
 * Checks common proxy headers before falling back to a placeholder.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers as Headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
