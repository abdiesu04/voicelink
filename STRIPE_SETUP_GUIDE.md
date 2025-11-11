# Stripe Setup Guide for Voztra

This guide will walk you through setting up Stripe products, prices, and webhooks for the Voztra application.

## Prerequisites

- Stripe account (sign up at https://stripe.com)
- Access to Stripe Dashboard
- Replit project with Stripe integration already installed

---

## Part 1: Create Products and Prices in Stripe Dashboard

### Step 1: Access Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Log in to your Stripe account
3. **Important**: Make sure you're in **Test mode** (toggle in top-right corner) for initial testing

### Step 2: Create Starter Plan Product

1. Navigate to **Products** in the left sidebar
2. Click **+ Add product** button
3. Fill in the product details:
   - **Name**: `Voztra Starter Plan`
   - **Description**: `350 minutes of voice translation per month`
   - **Image**: (Optional) Upload a product image
4. Under **Pricing**:
   - **Pricing model**: Select `Standard pricing`
   - **Price**: Enter `9.99`
   - **Billing period**: Select `Monthly`
   - **Currency**: Select `USD` (or your preferred currency)
5. Click **Save product**
6. **Copy the Price ID**: After saving, you'll see a price ID that starts with `price_...` - **COPY THIS ID** (you'll need it later)

### Step 3: Create Pro Plan Product

1. Click **+ Add product** again
2. Fill in the product details:
   - **Name**: `Voztra Pro Plan`
   - **Description**: `1200 minutes of voice translation per month with priority support`
   - **Image**: (Optional) Upload a product image
3. Under **Pricing**:
   - **Pricing model**: Select `Standard pricing`
   - **Price**: Enter `29.99`
   - **Billing period**: Select `Monthly`
   - **Currency**: Select `USD` (or your preferred currency)
4. Click **Save product**
5. **Copy the Price ID**: After saving, copy the price ID that starts with `price_...`

### Step 4: Add Price IDs to Replit Secrets

1. In your Replit project, click on **Secrets** in the left sidebar (lock icon)
2. Add the following secrets:

   **For Starter Plan:**
   - **Key**: `STRIPE_STARTER_PRICE_ID`
   - **Value**: Paste the Starter plan price ID (e.g., `price_1Abc123...`)
   
   **For Pro Plan:**
   - **Key**: `STRIPE_PRO_PRICE_ID`
   - **Value**: Paste the Pro plan price ID (e.g., `price_1Xyz789...`)

3. Click **Add secret** for each one

### Step 5: Add Frontend Environment Variables

You also need to add these price IDs to the frontend `.env` file for the Pricing page to work:

1. Create or edit `.env` file in the root of your project
2. Add the following lines:

```env
VITE_STRIPE_STARTER_PRICE_ID=price_1Abc123...
VITE_STRIPE_PRO_PRICE_ID=price_1Xyz789...
```

3. Replace the `price_...` values with your actual price IDs

---

## Part 2: Configure Stripe Webhooks

Webhooks are essential for handling subscription lifecycle events (payments, cancellations, etc.)

### Step 1: Get Your Replit App URL

1. In Replit, click the **Run** button to start your application
2. Copy the full URL from the webview (e.g., `https://your-project-name.username.repl.co`)
3. Keep this URL handy - you'll need it for webhook configuration

### Step 2: Create Webhook Endpoint in Stripe

1. In Stripe Dashboard, navigate to **Developers** → **Webhooks**
2. Click **+ Add endpoint**
3. **Endpoint URL**: Enter your Replit URL followed by `/api/webhooks/stripe`
   - Example: `https://your-project-name.username.repl.co/api/webhooks/stripe`
4. Click **Select events**
5. **Select the following events** (these are crucial for the app to work):
   - `checkout.session.completed` - When a user completes payment
   - `invoice.payment_succeeded` - When monthly payment succeeds
   - `customer.subscription.updated` - When subscription changes
   - `customer.subscription.deleted` - When subscription is cancelled
6. Click **Add events**
7. Click **Add endpoint** to save

### Step 3: Get Webhook Signing Secret

1. After creating the endpoint, you'll see it in the webhooks list
2. Click on the webhook endpoint you just created
3. In the **Signing secret** section, click **Reveal** or **Copy**
4. **Copy the webhook signing secret** (starts with `whsec_...`)

### Step 4: Add Webhook Secret to Replit

1. Go back to your Replit project
2. Click on **Secrets** in the left sidebar
3. Add a new secret:
   - **Key**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the webhook signing secret (e.g., `whsec_1Abc123...`)
4. Click **Add secret**

---

## Part 3: Testing Your Setup

### Test in Stripe Test Mode

1. Make sure you're still in **Test mode** in Stripe Dashboard
2. In your Voztra app, navigate to the Pricing page
3. Click "Get Started" on either Starter or Pro plan
4. You'll be redirected to Stripe Checkout
5. Use Stripe test card: **4242 4242 4242 4242**
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
6. Complete the checkout
7. You should be redirected to the payment success page
8. Check your Account page - you should see your subscription active with credits

### Verify Webhook Events

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Check the **Events** tab to see if events are being received
4. If you see successful events (200 status), webhooks are working!

### Common Issues & Fixes

**Issue**: Webhook events show 401 or 403 errors
- **Fix**: Make sure your `STRIPE_WEBHOOK_SECRET` in Replit Secrets exactly matches the signing secret from Stripe

**Issue**: Checkout redirects to error page
- **Fix**: Verify your price IDs are correct in both Replit Secrets and `.env` file

**Issue**: Credits not allocated after payment
- **Fix**: Check webhook events in Stripe Dashboard to see if `checkout.session.completed` was received

---

## Part 4: Going Live (Production)

### When you're ready to accept real payments:

1. **Switch to Live mode** in Stripe Dashboard (toggle in top-right)
2. **Re-create products and prices** in Live mode (repeat Part 1 steps)
3. **Update all secrets** in Replit with Live mode values:
   - `STRIPE_SECRET_KEY` (get from Stripe Dashboard → Developers → API keys → Secret key)
   - `STRIPE_STARTER_PRICE_ID` (new live mode price ID)
   - `STRIPE_PRO_PRICE_ID` (new live mode price ID)
   - `STRIPE_WEBHOOK_SECRET` (create new webhook endpoint in live mode)
4. **Update .env** file with live price IDs
5. **Deploy your Replit app** using the Deploy button

---

## Summary Checklist

- [ ] Created Starter Plan product in Stripe ($9.99/month)
- [ ] Created Pro Plan product in Stripe ($29.99/month)
- [ ] Added `STRIPE_STARTER_PRICE_ID` to Replit Secrets
- [ ] Added `STRIPE_PRO_PRICE_ID` to Replit Secrets
- [ ] Added both price IDs to `.env` file with `VITE_` prefix
- [ ] Created webhook endpoint with all 4 required events
- [ ] Added `STRIPE_WEBHOOK_SECRET` to Replit Secrets
- [ ] Tested checkout flow with test card
- [ ] Verified webhook events are received successfully
- [ ] Confirmed credits are allocated after successful payment

---

## Support

If you encounter issues:
1. Check Stripe Dashboard → Events log for detailed error messages
2. Check your Replit Console for server-side errors
3. Verify all environment variables are set correctly
4. Make sure you're using Test mode for testing

For production deployment, make sure to review Stripe's [Best Practices](https://stripe.com/docs/development/best-practices) and [Security Guidelines](https://stripe.com/docs/security/guide).
