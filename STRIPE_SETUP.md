# 🔐 RACIO Stripe Payment Setup Guide

## Quick Start (5 minutes)

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_test_` for test mode)

### Step 2: Create Products in Stripe

Go to **Products** → **Add Product**:

| Product Name | Price | Type | Billing | Notes |
|--------------|-------|------|---------|-------|
| RACIO Pro Monthly | $9 | Recurring | Monthly | Standard subscription |
| RACIO Pro Yearly | $79 | Recurring | Yearly | 27% savings vs monthly ($108) |
| RACIO Lifetime | $39 | One-time | — | Early-bird deal (limit 50) |

**Pricing Logic:**
- Monthly × 12 = $108/year
- Yearly at $79 = 27% savings (encourages annual commitment)
- Lifetime at $39 = Impulse buy for early adopters, later raise to $99

After creating each price, copy the **Price ID** (starts with `price_`).

### Step 3: Set Environment Variables

Create a `.env.local` file in your project root:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY

# Price IDs
STRIPE_PRICE_PRO_MONTHLY=price_XXXXXXX
STRIPE_PRICE_PRO_YEARLY=price_XXXXXXX
STRIPE_PRICE_LIFETIME=price_XXXXXXX

# Webhook Secret (set up in Step 4)
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXX

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Set Up Webhooks (For Production)

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your URL: `https://yourdomain.com/api/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copy the **Signing Secret** to `STRIPE_WEBHOOK_SECRET`

### Step 5: Test Locally

For local webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhook
```

---

## 💳 Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | `4242 4242 4242 4242` |
| Declined | `4000 0000 0000 0002` |
| Requires Auth | `4000 0025 0000 3155` |

Use any future expiry date and any 3-digit CVC.

---

## 🚀 Going Live

1. Toggle to **Live Mode** in Stripe Dashboard
2. Replace `sk_test_` keys with `sk_live_` keys
3. Create new products in Live Mode
4. Update all Price IDs
5. Set up a Live webhook endpoint
6. Update `NEXT_PUBLIC_APP_URL` to your domain

---

## Payment Flow

```
User clicks "Get Pro" 
    ↓
/api/checkout?plan=pro_monthly
    ↓
Stripe Checkout page
    ↓
Payment successful
    ↓
/api/checkout/success (generates license key)
    ↓
Redirect to /success?license=XXXXX-XXXXX-XXXXX-XXXXX
    ↓
User sees license key & Pro unlocked!
```

---

## License Key System

- Keys are stored in `.licenses.json` (development)
- Format: `XXXXX-XXXXX-XXXXX-XXXXX`
- Users can manually activate via the modal
- Keys are tied to Stripe customer ID for management

For production, replace the file-based storage with a database (Supabase, PlanetScale, etc.)
