# Stripe Payment Integration Setup

The payment field now supports real Stripe payments in test mode!

## What's Been Implemented

1. **Stripe Payment Element Component** - Embedded payment form with card input
2. **Payment Intent API Endpoint** - Server-side endpoint to create payment intents
3. **Dynamic Form Integration** - Payment field automatically renders Stripe form when configured

## How to Use

### 1. Add Payment Field to Form
- In the form builder, click **"+ Payment"** button
- Click on the payment field to configure it
- Click **"Show Advanced Options"**

### 2. Configure Payment Settings
- **Payment Provider**: Select "Stripe"
- **Payment Mode**: Select "Embedded payment form"
- **Collect Billing Address**: Toggle on if needed

### 3. Test in Preview
- Click the **"Preview"** button
- Fill out the form fields
- The payment field will show a real Stripe payment form
- The total amount updates automatically based on form selections

### 4. Test Card Numbers (Stripe Test Mode)

Use these test card numbers to simulate payments:

#### Successful Payment
- **Card Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

#### Declined Payment
- **Card Number**: `4000 0000 0000 0002`

#### Requires Authentication (3D Secure)
- **Card Number**: `4000 0027 6000 3184`

[Full list of test cards](https://stripe.com/docs/testing#cards)

## Payment Modes

### Embedded (Implemented ✅)
- Payment form appears directly in your form
- User never leaves your site
- Best user experience
- Requires Stripe API keys

### Redirect (Placeholder)
- User clicks button → redirected to Stripe Checkout
- Simpler to implement
- Stripe handles entire payment flow

### Display Only (Placeholder)
- Shows total amount only
- Payment handled separately (invoice, phone, etc.)

## Environment Variables

Already configured in your `.env` file:

```env
STRIPE_SECRET_KEY=sk_test_... (Server-side, never exposed)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (Client-side, safe to expose)
STRIPE_WEBHOOK_SECRET=whsec_... (For webhooks)
```

## Security Notes

✅ **Test Mode Active**
- All keys start with `sk_test_` and `pk_test_`
- No real charges will be made
- Only test card numbers work

⚠️ **Going Live**
- Replace test keys with live keys from Stripe Dashboard
- Live keys start with `sk_live_` and `pk_live_`
- Set up webhooks for payment confirmation
- Implement proper error handling and logging

## Architecture

```
Form Builder (Admin)
  └─> Service Edit Page
      └─> Preview Dialog
          └─> DynamicFormRenderer
              └─> StripePaymentElement
                  ├─> Calls /api/stripe/create-payment-intent
                  ├─> Stripe JS SDK loads payment form
                  └─> Processes payment via Stripe API
```

## Files Created/Modified

### New Files
- `src/components/payment/stripe-payment-element.tsx` - Stripe payment component
- `src/app/api/stripe/create-payment-intent/route.ts` - Payment intent API

### Modified Files
- `src/components/admin/form-builder/dynamic-form-renderer.tsx` - Added Stripe integration
- `.env` - Added NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

## Next Steps

1. **Test Payment Flow**: Try making a test payment in preview mode
2. **Add Other Providers**: Square, PayPal can be added similarly
3. **Webhook Handler**: Create endpoint to handle payment confirmations
4. **Order Management**: Save payment details to database after success
5. **Email Notifications**: Send confirmation emails after payment

## Troubleshooting

### "Failed to initialize payment"
- Check that Stripe keys are in `.env` file
- Restart dev server (`npm run dev`)
- Verify keys are correct in Stripe Dashboard

### Payment form not appearing
- Check browser console for errors
- Ensure payment mode is set to "Embedded"
- Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists

### "Amount must be at least $0.50"
- Stripe requires minimum $0.50
- Check that form has pricing configured
- Ensure calculatedPrice is > 0

## Resources

- [Stripe Payment Element Docs](https://stripe.com/docs/payments/payment-element)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Dashboard](https://dashboard.stripe.com/test/dashboard)
