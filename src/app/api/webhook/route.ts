import { NextRequest, NextResponse } from "next/server";
import { generateLicenseKey, saveLicense } from "@/lib/stripe";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

// Verify Lemon Squeezy webhook signature (HMAC-SHA256)
function verifySignature(payload: string, signature: string): boolean {
    if (!WEBHOOK_SECRET) {
        console.warn("⚠️ LEMONSQUEEZY_WEBHOOK_SECRET not set — skipping verification");
        return true; // Allow in dev, but warn
    }

    const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

// Map Lemon Squeezy product/variant to plan type
function getPlanType(productName: string, variantName: string): "pro_monthly" | "pro_yearly" | "lifetime" {
    const name = `${productName} ${variantName}`.toLowerCase();
    if (name.includes("lifetime")) return "lifetime";
    if (name.includes("yearly") || name.includes("annual")) return "pro_yearly";
    return "pro_monthly";
}

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("x-signature") || "";
    const eventName = request.headers.get("x-event-name") || "";

    // Verify signature
    if (WEBHOOK_SECRET && !verifySignature(body, signature)) {
        console.error("❌ Webhook signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let event;
    try {
        event = JSON.parse(body);
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`📬 Lemon Squeezy webhook: ${eventName}`);

    switch (eventName) {
        case "order_created": {
            const { data, meta } = event;
            const attrs = data?.attributes;

            if (!attrs) {
                console.error("Missing order attributes");
                break;
            }

            const customerEmail = attrs.user_email || meta?.custom_data?.email || "unknown@email.com";
            const productName = attrs.first_order_item?.product_name || "";
            const variantName = attrs.first_order_item?.variant_name || "";
            const plan = getPlanType(productName, variantName);
            const orderId = String(data.id);

            // Only process paid orders
            if (attrs.status === "paid" || attrs.status === "active") {
                const licenseKey = generateLicenseKey();

                await saveLicense(licenseKey, {
                    email: customerEmail,
                    plan,
                    createdAt: new Date().toISOString(),
                    activated: false,
                    stripeCustomerId: `ls_${attrs.customer_id}`,
                    stripeSubscriptionId: orderId,
                });

                console.log(`✅ License created: ${licenseKey} for ${customerEmail} (${plan})`);
                console.log(`   Order ID: ${orderId}`);
            } else {
                console.log(`⏳ Order ${orderId} status: ${attrs.status} — not generating license yet`);
            }
            break;
        }

        case "subscription_created": {
            const { data, meta } = event;
            const attrs = data?.attributes;

            if (!attrs) break;

            const customerEmail = attrs.user_email || meta?.custom_data?.email || "unknown@email.com";
            const productName = attrs.product_name || "";
            const variantName = attrs.variant_name || "";
            const plan = getPlanType(productName, variantName);

            if (attrs.status === "active") {
                const licenseKey = generateLicenseKey();

                await saveLicense(licenseKey, {
                    email: customerEmail,
                    plan,
                    createdAt: new Date().toISOString(),
                    activated: false,
                    stripeCustomerId: `ls_${attrs.customer_id}`,
                    stripeSubscriptionId: String(data.id),
                });

                console.log(`✅ Subscription license: ${licenseKey} for ${customerEmail} (${plan})`);
            }
            break;
        }

        case "subscription_cancelled":
        case "subscription_expired": {
            const { data } = event;
            const attrs = data?.attributes;
            console.log(`⚠️ Subscription ${eventName}: ${data?.id} (${attrs?.user_email})`);
            // TODO: Revoke license key associated with this subscription
            break;
        }

        case "subscription_payment_failed": {
            const { data } = event;
            const attrs = data?.attributes;
            console.log(`❌ Payment failed for subscription: ${data?.id} (${attrs?.user_email})`);
            break;
        }

        default:
            console.log(`ℹ️ Unhandled Lemon Squeezy event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
}
