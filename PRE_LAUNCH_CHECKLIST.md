# Pre-Launch Checklist
> Items to complete after initial Vercel testing but before final production launch.
> Add to this list as issues are discovered during development.

---

## 🔐 Security & Auth
- [ ] Set `JWT_SECRET` env var in Vercel (strong random value, e.g. `openssl rand -hex 32`)
- [ ] Set `PAYMENT_ENCRYPTION_KEY` env var in Vercel (64-char hex, used to encrypt stored payment keys)

## 💳 Payments — Stripe
- [ ] Add live Stripe secret key + publishable key in Admin → Settings → Payments
- [ ] Create Stripe webhook in Stripe Dashboard pointing to `https://your-domain.com/api/webhooks/stripe`
  - Events needed: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.expired`
- [ ] Set `STRIPE_WEBHOOK_SECRET` env var in Vercel (from Stripe webhook dashboard)
- [ ] Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` env vars in Vercel (as fallback)

## 💳 Payments — Square (if using)
- [ ] Add live Square access token + location ID in Admin → Settings → Payments
- [ ] Create Square webhook subscription in Square Developer Dashboard
  - Notification URL: `https://your-domain.com/api/webhooks/square`
  - Events: `payment.completed`, `payment.failed`
- [ ] Set `SQUARE_WEBHOOK_SIGNATURE_KEY` env var in Vercel (from Square webhook subscription page)
- [ ] Set `NEXT_PUBLIC_APP_URL=https://your-domain.com` env var in Vercel (required for Square HMAC verification)

## 📧 Notifications
- [ ] Configure email provider in Admin → Settings → Notifications (SMTP or SendGrid etc.)
- [ ] Send a test booking confirmation email end-to-end
- [ ] Verify admin notification emails are going to the right address

## 🗄️ Database
- [ ] Confirm Neon production database is being used (not a dev branch)
- [ ] Run all migrations against production DB
- [ ] Seed required data: dumpster sizes, pricing options, fleet units, business settings

## ⚙️ Business Settings (Admin Panel)
- [ ] Set business name, address, phone, email in Admin → Settings → General
- [ ] Configure service area / zip codes
- [ ] Set booking auto-confirmation preference
- [ ] Upload logo / set brand colors if applicable

## 🔒 Access Codes
- [ ] `generateAccessCode()` in `src/app/api/bookings/route.ts` uses `Math.random()` — not cryptographically secure
  - Consider replacing with `crypto.randomInt(100000, 999999).toString()` before launch

## 🌐 Domain & Hosting
- [ ] Point custom domain to Vercel deployment
- [ ] Verify SSL cert is active
- [ ] Update `NEXT_PUBLIC_APP_URL` to final custom domain (critical for Square webhooks)
- [ ] Update webhook URLs in Stripe and Square dashboards to final domain

## 🧪 End-to-End Testing (on Vercel preview before go-live)
- [ ] Complete a test booking as a customer (Stripe)
- [ ] Complete a test booking as a customer (Square, if applicable)
- [ ] Verify booking appears in Admin → Bookings
- [ ] Verify confirmation email is received
- [ ] Verify admin notification is received
- [ ] Test admin login / logout
- [ ] Test customer portal login with access code
- [ ] Verify webhook fires and updates booking payment status

## 🧹 Cleanup
- [ ] Remove any test/seed data from production DB before launch
- [ ] Review and remove any remaining `console.log` debug statements
- [ ] Check that no `.env.local` secrets are committed to git
