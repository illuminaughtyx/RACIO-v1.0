import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRODUCTS, PlanType } from "@/lib/stripe";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get("plan") as PlanType;

    if (!plan || !STRIPE_PRODUCTS[plan]) {
        return NextResponse.redirect(new URL("/pricing?error=invalid_plan", request.url));
    }

    const product = STRIPE_PRODUCTS[plan];

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.redirect(new URL("/pricing?error=stripe_not_configured", request.url));
    }

    if (!product.priceId) {
        return NextResponse.redirect(new URL("/pricing?error=price_not_configured", request.url));
    }

    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

        // Determine success URL based on plan type
        const successPlanParam = plan === "lifetime" ? "lifetime" : "pro";

        // Base session parameters
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: product.mode,
            line_items: [
                {
                    price: product.priceId,
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&plan=${successPlanParam}`,
            cancel_url: `${baseUrl}/pricing?canceled=true`,
            allow_promotion_codes: true,
            billing_address_collection: "auto",
            metadata: {
                plan: plan,
            },
        };

        // Only add customer_creation for payment mode (lifetime)
        if (product.mode === "payment") {
            sessionParams.customer_creation = "always";
            sessionParams.invoice_creation = { enabled: true };
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return NextResponse.redirect(session.url!);
    } catch (error) {
        console.error("Stripe checkout error:", error);
        return NextResponse.redirect(
            new URL(`/pricing?error=checkout_failed`, request.url)
        );
    }
}
