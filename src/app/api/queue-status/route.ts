import { NextResponse } from "next/server";
import { processingQueue, downloadQueue } from "@/lib/queue";

/**
 * GET /api/queue-status
 * Returns current queue status for monitoring
 */
export async function GET() {
    const processStatus = processingQueue.getStatus();
    const downloadStatus = downloadQueue.getStatus();
    const estimatedWait = processingQueue.getEstimatedWait();

    return NextResponse.json({
        // Combined view for frontend
        active: processStatus.active + downloadStatus.active,
        queued: processStatus.queued + downloadStatus.queued,
        maxConcurrent: processStatus.maxConcurrent,
        estimatedWaitSeconds: estimatedWait,
        serverLoad: processStatus.active === processStatus.maxConcurrent ? "HIGH" : processStatus.active > 0 ? "MEDIUM" : "LOW",
        // Detailed breakdown
        processing: processStatus,
        downloads: downloadStatus,
    });
}
