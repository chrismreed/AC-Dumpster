import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { customerAccounts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';

export interface CustomerSession {
  id: number;
  email: string;
  name: string | null;
  companyName: string | null;
  isBusinessAccount: boolean | null;
  phone: string | null;
}

/**
 * Get the current customer session from the cookie.
 * Returns null if no valid session exists.
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('customer_token')?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET_CUSTOMER;
    if (!jwtSecret) throw new Error('JWT_SECRET_CUSTOMER environment variable is not set');

    const decoded = jwt.verify(token, jwtSecret) as { customerId: number };
    const customerId = decoded.customerId;

    if (!customerId || typeof customerId !== 'number') {
      return null;
    }

    const [customer] = await db
      .select({
        id: customerAccounts.id,
        email: customerAccounts.email,
        name: customerAccounts.name,
        companyName: customerAccounts.companyName,
        isBusinessAccount: customerAccounts.isBusinessAccount,
        phone: customerAccounts.phone,
      })
      .from(customerAccounts)
      .where(eq(customerAccounts.id, customerId));

    if (!customer) {
      return null;
    }

    return customer;
  } catch (error) {
    console.error('Error getting customer session:', error);
    return null;
  }
}

/**
 * Require a valid customer session. Returns the session or throws.
 * Use in API routes that need authentication.
 */
export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
