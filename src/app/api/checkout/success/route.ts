import { NextRequest, NextResponse } from "next/server";
import { stripe, generateLicenseKey, saveLicense, PlanType } from "@/lib/stripe";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");
    const plan = searchParams.get("plan") || "pro";

    if (!sessionId) {
        return NextResponse.redirect(new URL("/pricing?error=no_session", request.url));
    }

    try {
        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["customer", "subscription"],
        });

        // Verify payment was successful
        if (session.payment_status !== "paid") {
            return NextResponse.redirect(new URL("/pricing?error=payment_failed", request.url));
        }

        // Generate a license key for this purchase
        const licenseKey = generateLicenseKey();
        const customerEmail = session.customer_details?.email || "unknown@email.com";
        const planType = (session.metadata?.plan as PlanType) || (plan === "lifetime" ? "lifetime" : "pro_monthly");

        // Save the license
        await saveLicense(licenseKey, {
            email: customerEmail,
            plan: planType,
            createdAt: new Date().toISOString(),
            activated: false,
            stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        });

        // Redirect to success page with license key
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
        return NextResponse.redirect(
            new URL(`/success?plan=${plan}&license=${licenseKey}`, baseUrl)
        );
    } catch (error) {
        console.error("Checkout success error:", error);
        return NextResponse.redirect(new URL("/pricing?error=verification_failed", request.url));
    }
}
