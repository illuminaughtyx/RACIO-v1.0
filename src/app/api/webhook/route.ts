import { NextRequest, NextResponse } from "next/server";
import { stripe, generateLicenseKey, saveLicense } from "@/lib/stripe";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            // Only process if payment was successful
            if (session.payment_status === "paid") {
                const licenseKey = generateLicenseKey();
                const customerEmail = session.customer_details?.email || "unknown@email.com";
                const plan = (session.metadata?.plan as "pro_monthly" | "pro_yearly" | "lifetime") || "pro_monthly";

                await saveLicense(licenseKey, {
                    email: customerEmail,
                    plan,
                    createdAt: new Date().toISOString(),
                    activated: false,
                    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
                    stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : undefined,
                });

                console.log(`✅ License created: ${licenseKey} for ${customerEmail} (${plan})`);

                // TODO: Send email with license key
                // await sendLicenseEmail(customerEmail, licenseKey, plan);
            }
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            console.log(`⚠️ Subscription cancelled: ${subscription.id}`);
            // TODO: Revoke license key associated with this subscription
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`❌ Payment failed for invoice: ${invoice.id}`);
            // TODO: Notify user about failed payment
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
