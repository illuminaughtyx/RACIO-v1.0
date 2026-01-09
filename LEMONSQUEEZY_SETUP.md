# 🍋 RACIO Lemon Squeezy Payment Setup

## Why Lemon Squeezy?

✅ **Works in India** - No invite required like Stripe  
✅ **Handles everything** - Payments, taxes, invoices  
✅ **Simple setup** - Create product → Get link → Done  
✅ **License keys built-in** - Auto-generates keys on purchase  

---

## Quick Setup (10 minutes)

### Step 1: Create a Lemon Squeezy Account

1. Go to [lemonsqueezy.com](https://lemonsqueezy.com)
2. Sign up with your email
3. Complete onboarding (business details, payout info)

### Step 2: Create Your Store

1. Go to **Settings** → **Store**
2. Set your store name: "RACIO" or "racioapp"
3. Add logo and branding

### Step 3: Create Products

Go to [app.lemonsqueezy.com/products](https://app.lemonsqueezy.com/products) → **New Product**

#### Product 1: RACIO Pro Monthly
- **Name:** RACIO Pro Monthly
- **Price:** $9/month (recurring)
- **Description:** Unlimited video conversions, 5x faster processing
- ✅ Enable "License Keys" in Variants
- Save & Publish

#### Product 2: RACIO Pro Yearly  
- **Name:** RACIO Pro Yearly
- **Price:** $79/year (recurring)
- **Description:** Save 27% - Everything in Pro
- ✅ Enable "License Keys"
- Save & Publish

#### Product 3: RACIO Lifetime
- **Name:** RACIO Lifetime Access
- **Price:** $39 (one-time)
- **Description:** Pay once, use forever. All Pro features + future updates.
- ✅ Enable "License Keys"
- Save & Publish

### Step 4: Get Your Checkout Links

For each product:
1. Click on the product → **Share**
2. Copy the checkout URL (e.g., `https://racioapp.lemonsqueezy.com/buy/xyz123`)

### Step 5: Update Your Code

Edit `src/app/page.tsx` and replace the placeholder links:

```javascript
const PAYMENT_LINKS = {
  PRO_MONTHLY: "https://racioapp.lemonsqueezy.com/buy/YOUR_MONTHLY_ID",
  PRO_YEARLY: "https://racioapp.lemonsqueezy.com/buy/YOUR_YEARLY_ID",
  LIFETIME: "https://racioapp.lemonsqueezy.com/buy/YOUR_LIFETIME_ID",
};
```

Also update `src/app/pricing/page.tsx` with the same links.

---

## Setting Up Webhooks (For License Automation)

### Step 1: Create Webhook

1. Go to **Settings** → **Webhooks**
2. Click **New Webhook**
3. URL: `https://yourdomain.com/api/lemonsqueezy/webhook`
4. Select events:
   - `order_created`
   - `subscription_created`
   - `license_key_created`
5. Copy the **Signing Secret**

### Step 2: Add Environment Variable

```env
LEMONSQUEEZY_WEBHOOK_SECRET=your_signing_secret
```

---

## Test Cards

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Decline |

Use any future date and any CVC.

---

## Payment Flow

```
User clicks "Get Pro"
    ↓
Lemon Squeezy Checkout (hosted)
    ↓
User pays with card/PayPal
    ↓
License key auto-generated
    ↓
Webhook notifies your app (optional)
    ↓
User enters license key in RACIO
    ↓
Pro features unlocked! 🎉
```

---

## Pricing Summary

| Plan | Price | Type |
|------|-------|------|
| **Free** | $0 | 3 videos/day |
| **Pro Monthly** | $9/mo | Unlimited |
| **Pro Yearly** | $79/yr | 27% savings |
| **Lifetime** | $39 | Pay once, use forever |

---

## FAQ

**Q: How do users get their license key?**  
A: Lemon Squeezy emails it automatically after purchase

**Q: Can I customize the checkout page?**  
A: Yes! Settings → Checkout → Customize colors/logo

**Q: What payout methods are available?**  
A: PayPal and bank transfer

**Q: What % does Lemon Squeezy take?**  
A: 5% + payment processing (~2.9%)

---

## Need Help?

- [Lemon Squeezy Docs](https://docs.lemonsqueezy.com)
- [Help Center](https://help.lemonsqueezy.com)
