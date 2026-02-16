import { NextRequest, NextResponse } from "next/server";

/**
 * License Validation via Lemon Squeezy API
 * 
 * Instead of storing licenses in a local JSON file (which gets wiped on deploy),
 * we validate directly against Lemon Squeezy's License API.
 * 
 * Flow:
 * 1. User enters their license key (from Lemon Squeezy purchase email)
 * 2. We call POST /v1/licenses/activate to activate + validate
 * 3. If valid, we return the plan type based on product_name
 * 4. Client stores the result in localStorage
 */

export async function POST(request: NextRequest) {
    try {
        const { licenseKey } = await request.json();

        if (!licenseKey || typeof licenseKey !== "string") {
            return NextResponse.json(
                { valid: false, error: "License key is required" },
                { status: 400 }
            );
        }

        const normalizedKey = licenseKey.trim();

        // First, try to validate the license key
        const validateRes = await fetch("https://api.lemonsqueezy.com/v1/licenses/validate", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
            },
            body: new URLSearchParams({
                license_key: normalizedKey,
                instance_name: "RACIO",
            }).toString(),
        });

        const validateData = await validateRes.json();

        // If the license is valid (already activated or inactive)
        if (validateData.valid || validateData.license_key?.status === "inactive") {
            // If inactive, activate it first
            if (validateData.license_key?.status === "inactive") {
                const activateRes = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json",
                    },
                    body: new URLSearchParams({
                        license_key: normalizedKey,
                        instance_name: "RACIO",
                    }).toString(),
                });

                const activateData = await activateRes.json();

                if (!activateData.activated) {
                    return NextResponse.json(
                        { valid: false, error: activateData.error || "Failed to activate license" },
                        { status: 400 }
                    );
                }

                // Use activation response data
                return buildSuccessResponse(activateData);
            }

            // Already active/valid — return success
            return buildSuccessResponse(validateData);
        }

        // Check for specific error messages
        const errorMsg = validateData.error || "Invalid license key";

        if (validateData.license_key?.status === "expired") {
            return NextResponse.json(
                { valid: false, error: "This license has expired. Please renew your subscription." },
                { status: 400 }
            );
        }

        if (validateData.license_key?.status === "disabled") {
            return NextResponse.json(
                { valid: false, error: "This license has been disabled. Please contact support." },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { valid: false, error: errorMsg },
            { status: 400 }
        );
    } catch (error) {
        console.error("License validation error:", error);
        return NextResponse.json(
            { valid: false, error: "Validation failed. Please try again." },
            { status: 500 }
        );
    }
}

/**
 * Build a success response from Lemon Squeezy API data
 * Determines plan type from product_name in meta
 */
function buildSuccessResponse(lsData: any) {
    const productName = (lsData.meta?.product_name || "").toLowerCase();
    const variantName = (lsData.meta?.variant_name || "").toLowerCase();

    // Determine plan type from product name
    let plan = "pro_monthly"; // default
    let isLifetime = false;

    if (productName.includes("lifetime") || variantName.includes("lifetime")) {
        plan = "lifetime";
        isLifetime = true;
    } else if (productName.includes("yearly") || variantName.includes("yearly") || variantName.includes("annual")) {
        plan = "pro_yearly";
    }

    return NextResponse.json({
        valid: true,
        plan,
        isLifetime,
        status: lsData.license_key?.status || "active",
        customerEmail: lsData.meta?.customer_email || null,
    });
}
