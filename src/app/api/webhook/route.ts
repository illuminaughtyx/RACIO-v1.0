import { NextRequest, NextResponse } from "next/server";
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

    // ============================================================================
    // LICENSE KEYS ARE NOW MANAGED BY LEMON SQUEEZY
    // ============================================================================
    // Lemon Squeezy auto-generates license keys when "Generate License Keys" is
    // enabled on a product. License keys are:
    //   - Sent to the customer via email by Lemon Squeezy
    //   - Validated via POST /v1/licenses/validate on the LS API
    //   - Activated via POST /v1/licenses/activate on the LS API
    //
    // This webhook now only handles logging and monitoring.
    // No local file storage needed.
    // ============================================================================

    switch (eventName) {
        case "order_created": {
            const { data, meta } = event;
            const attrs = data?.attributes;
            const customerEmail = attrs?.user_email || meta?.custom_data?.email || "unknown";
            const status = attrs?.status || "unknown";
            const total = attrs?.total_formatted || "$0";
            const productName = attrs?.first_order_item?.product_name || "Unknown Product";

            console.log(`✅ New order: ${productName} for ${customerEmail} — ${total} (status: ${status})`);
            console.log(`   Order ID: ${data?.id}`);
            break;
        }

        case "subscription_created": {
            const { data } = event;
            const attrs = data?.attributes;
            const customerEmail = attrs?.user_email || "unknown";
            const productName = attrs?.product_name || "Unknown";

            console.log(`✅ New subscription: ${productName} for ${customerEmail} (status: ${attrs?.status})`);
            break;
        }

        case "subscription_cancelled":
        case "subscription_expired": {
            const { data } = event;
            const attrs = data?.attributes;
            console.log(`⚠️ Subscription ${eventName}: ${data?.id} (${attrs?.user_email})`);
            // License key will show as "expired" when validated via LS API
            break;
        }

        case "subscription_payment_failed": {
            const { data } = event;
            const attrs = data?.attributes;
            console.log(`❌ Payment failed for subscription: ${data?.id} (${attrs?.user_email})`);
            break;
        }

        case "license_key_created": {
            const { data } = event;
            const attrs = data?.attributes;
            console.log(`🔑 License key created: ${attrs?.key} (status: ${attrs?.status})`);
            break;
        }

        default:
            console.log(`ℹ️ Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
}
