# Code Review TODO List
> Generated: 2026-03-03 | Internal review + CodeRabbit (in progress)
> Fix items in order — Critical first, then High, Medium, Low.

---

## 🔴 CRITICAL (Fix before any real payments go through)

- [x] **`src/app/api/confirm-payment/route.ts`** — Added metadata binding check: payment intent must match the booking via Stripe's own `metadata.bookingId`. Also removed raw error leakage from 500 response.

- [x] **`src/app/api/stripe/create-payment-intent/route.ts`** — Now accepts `bookingId`, looks up `totalPrice` from DB server-side, and sets `metadata.bookingId` on the intent (required for confirm-payment binding check).

- [x] **`src/app/api/square/create-payment/route.ts`** — Now looks up amount from DB server-side. Also fixed: successful Square payments now immediately update booking `paymentStatus`/`status` (previously relied only on webhook).
  - ✅ Frontend updated: `stripe-payment-element.tsx`, `square-payment-element.tsx`, `square-payment-form.tsx`, `payment-element.tsx` all updated.

- [x] **`src/app/api/checkout/route.ts`** — `totalPrice`, `rentalPrice`, and `bookingPricingMode` are now computed server-side via `bookingInputSchema` (omits these fields). Tier price comes from DB; per-day price uses shared `calculatePerDayRental()` with dumpster config from DB. Add-ons re-fetched from DB (only active add-ons counted; client prices ignored). Pricing tier ownership verified against dumpster. Min/max day bounds enforced. `paymentStatus`/`status`/`stripePaymentIntentId` also stripped from client input.

---

## 🟠 HIGH

- [x] **`src/lib/payment-config.ts`** — `clearPaymentConfigCache()` now also clears `cachedStripeClient`. Key rotation takes effect immediately.

- [x] **`src/lib/payment-config.ts`** — `decrypt()` now returns `''` + logs a warning on failure instead of silently returning ciphertext.

- [x] **`src/app/api/admin/login/route.ts` + `src/app/api/customer/login/route.ts`** — DB-backed rate limiting added via `src/lib/rate-limit.ts`. Admin: 5 attempts/15 min. Customer: 10 attempts/15 min. Returns 429 + `Retry-After` header. Counter resets on successful login. Also fixed missing `await cookies()` in admin login.

- [x] **`src/app/api/customer/login/route.ts`** — `ACCOUNT_NOT_SETUP` and `EMAIL_NOT_VERIFIED` now return 401 instead of 403. Also fixed missing `await cookies()`.

- [x] **`src/lib/admin-auth.ts`** — `isAdmin` check added. *(Fixed in earlier session)*

- [x] **`src/app/api/webhook/route.ts`** — Shadow route disabled (returns 410). *(Fixed in earlier session)*

- [x] **`src/lib/email.ts`** — Race condition fixed: `sendTemplatedEmail` now creates a fresh `MailService` instance per call when a dynamic API key is provided. Global `sgMail` singleton is never mutated.

- [x] **`src/lib/notifications.ts`** — Twilio auth token + SendGrid API key now decrypted on read via `decrypt()`. **`src/app/api/admin/settings/route.ts`** updated to encrypt these on write and mask them on GET (same AES-256-GCM pattern as payment secrets). Backward-compatible — existing plaintext DB values pass through `decrypt()` unchanged.

---

## 🟡 MEDIUM

- [x] **`src/lib/customer-auth.ts` line 22** — Already fixed (confirmed `await cookies()` present on line 22). Stale entry.

- [x] **`src/app/api/checkout/route.ts`** — Added `src/app/api/cron/cleanup-pending-bookings/route.ts` + `vercel.json` (runs hourly). Cancels bookings with `paymentStatus='pending'` AND `status='pending'` older than 2 hours, and their associated pending jobs. Protected by `CRON_SECRET` env var. `CRON_SECRET` added to `.env.local`.

- [x] **`src/app/api/checkout/route.ts`** — 500 response now returns only `{ message: 'Failed to create booking' }`. Full error logged server-side only.

- [x] **`src/lib/payment-config.ts`** — Single-flight pattern added. `getPaymentConfig()` now stores the in-flight `fetchPaymentConfig()` Promise in `configFetchPromise`; concurrent callers reuse it. `clearPaymentConfigCache()` also nulls the in-flight promise.

- [x] **`src/app/api/admin/login/route.ts` + `src/app/api/customer/login/route.ts`** — JWTs now use separate secrets: `JWT_SECRET_ADMIN` (admin login + `verifyAdminAuth`) and `JWT_SECRET_CUSTOMER` (customer login + `getCustomerSession`). Both vars added to `.env.local` with same initial value as `JWT_SECRET` so existing sessions remain valid. Independently rotatable going forward.

---

## 🟢 LOW

- [x] **`src/lib/payment-config.ts`** — `encrypt('')` now logs a `console.warn` so the empty-save is visible in server logs.

- [x] **`src/lib/email.ts` line 7** — `APP_URL` now logs a `console.error` at module load time when `NEXT_PUBLIC_APP_URL` is unset in production, rather than silently defaulting to localhost.

---

## ⏳ Waiting on CodeRabbit

CodeRabbit review was triggered on PR #1 on 2026-03-03. Add findings here once results come in.

---

## ✅ Completed

- [x] **`src/lib/customer-auth.ts` line 22** — Added missing `await` to `cookies()` call
- [x] **`src/lib/admin-auth.ts`** — Added `isAdmin` check before returning authorized; revoked admins now denied immediately
- [x] **`src/app/api/webhook/route.ts`** — Shadow webhook disabled (returns 410 Gone), canonical handler at `/api/webhooks/stripe`
