import { NextRequest, NextResponse } from "next/server";
import { checkUsageLimit, FREE_LIMIT } from "@/lib/usage";

export async function GET(req: NextRequest) {
    // Get client IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
        req.headers.get("x-real-ip") ||
        "unknown";

    const { allowed, remaining } = checkUsageLimit(ip);

    return NextResponse.json({
        allowed,
        remaining,
        limit: FREE_LIMIT,
        isPro: false, // TODO: Check subscription status
    });
}
