# Stripe Webhook Setup for Automatic Payment Status Updates

## Overview
This guide shows you how to set up Stripe webhooks to automatically update payment statuses when customers complete payments, eliminating the need to manually check payment status.

## Benefits
- **Instant Updates**: Payment status changes immediately when payment completes
- **No Performance Impact**: Runs independently of user interactions
- **Reliable**: Stripe guarantees delivery of webhook events
- **Efficient**: Only processes actual payment events

## Setup Instructions

### 1. Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"

### 2. Configure Webhook Endpoint
1. **Endpoint URL**: Enter your deployed app URL + `/api/webhook`
   - Example: `https://your-app-name.vercel.app/api/webhook`
2. **Events to send**: Select these events:
   - `checkout.session.completed`
   - `payment_link.payment.completed` (if available)

### 3. Get Webhook Secret
1. After creating the webhook, click on it
2. Click "Reveal" in the "Signing secret" section
3. Copy the webhook secret (starts with `whsec_`)

### 4. Add Webhook Secret to Environment
Add the webhook secret to your Vercel environment variables:
- Key: `STRIPE_WEBHOOK_SECRET`
- Value: The webhook secret you copied (starts with `whsec_`)

### 5. Test the Webhook
1. Create a test charge in your admin dashboard
2. Use the payment link to make a test payment
3. Check the webhook logs in Stripe dashboard
4. Verify the payment status updates automatically in your admin dashboard

## How It Works
1. Customer completes payment through Stripe payment link
2. Stripe sends webhook event to your app
3. Your app verifies the webhook signature for security
4. App finds the matching payment link in database
5. Payment status automatically updates to "paid"
6. Admin dashboard shows updated status immediately

## Troubleshooting
- Check webhook logs in Stripe dashboard for delivery issues
- Verify webhook secret is correctly set in environment variables
- Ensure your app is deployed and accessible from the internet
- Test webhook endpoint manually if needed

## Fallback Option
The "Check Status" button remains available as a backup method for manual status updates if needed.