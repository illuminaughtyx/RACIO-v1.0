import { NextResponse } from "next/server";
import { processingQueue } from "@/lib/queue";

/**
 * GET /api/queue-status
 * Returns current queue status for monitoring
 */
export async function GET() {
    const status = processingQueue.getStatus();
    const estimatedWait = processingQueue.getEstimatedWait();

    return NextResponse.json({
        ...status,
        estimatedWaitSeconds: estimatedWait,
        serverLoad: status.active === status.maxConcurrent ? "HIGH" : status.active > 0 ? "MEDIUM" : "LOW",
    });
}
