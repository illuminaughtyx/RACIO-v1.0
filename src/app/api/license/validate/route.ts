import { NextRequest, NextResponse } from "next/server";
import { getLicense, activateLicense } from "@/lib/stripe";

export async function POST(request: NextRequest) {
    try {
        const { licenseKey } = await request.json();

        if (!licenseKey || typeof licenseKey !== "string") {
            return NextResponse.json(
                { valid: false, error: "License key is required" },
                { status: 400 }
            );
        }

        // Normalize the key (uppercase, trim)
        const normalizedKey = licenseKey.trim().toUpperCase();

        // Check if the license exists
        const license = await getLicense(normalizedKey);

        if (!license) {
            return NextResponse.json(
                { valid: false, error: "Invalid license key" },
                { status: 404 }
            );
        }

        // Activate the license if not already
        if (!license.activated) {
            await activateLicense(normalizedKey);
        }

        // Determine if this is a lifetime or pro subscription
        const isLifetime = license.plan === "lifetime";

        return NextResponse.json({
            valid: true,
            plan: license.plan,
            isLifetime,
            email: license.email,
            activatedAt: license.activated ? license.createdAt : new Date().toISOString(),
        });
    } catch (error) {
        console.error("License validation error:", error);
        return NextResponse.json(
            { valid: false, error: "Validation failed" },
            { status: 500 }
        );
    }
}
