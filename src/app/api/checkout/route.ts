import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe (use env variable in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-12-18.acacia",
});

const PRICES = {
    pro_monthly: {
        price: 900, // $9.00 in cents
        name: "RACIO Pro Monthly",
        interval: "month" as const,
    },
    pro_yearly: {
        price: 4900, // $49.00 in cents
        name: "RACIO Pro Yearly",
        interval: "year" as const,
    },
};

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const plan = searchParams.get("plan") as keyof typeof PRICES;

    if (!plan || !PRICES[plan]) {
        return NextResponse.redirect(new URL("/pricing", req.url));
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        // For demo, redirect to a success simulation
        return NextResponse.redirect(
            new URL(`/success?demo=true&plan=${plan}`, req.url)
        );
    }

    try {
        const priceData = PRICES[plan];

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: priceData.name,
                            description: "Unlimited conversions, no watermarks, priority processing",
                            images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://racio.app"}/logo-option-1.png`],
                        },
                        unit_amount: priceData.price,
                        recurring: {
                            interval: priceData.interval,
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/pricing`,
            allow_promotion_codes: true,
            billing_address_collection: "auto",
        });

        if (session.url) {
            return NextResponse.redirect(session.url);
        }

        return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    } catch (error: any) {
        console.error("Stripe error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
