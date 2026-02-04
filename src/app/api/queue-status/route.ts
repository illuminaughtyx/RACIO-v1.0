import { NextResponse } from "next/server";
import { processingQueue, downloadQueue, imageQueue, getAllQueueStatus, canAcceptRequests } from "@/lib/queue";

/**
 * GET /api/queue-status
 * Returns current queue status for monitoring and UI feedback
 */
export async function GET() {
    const allStatus = getAllQueueStatus();
    const processStatus = processingQueue.getStatus();
    const downloadStatus = downloadQueue.getStatus();
    const imageStatus = imageQueue.getStatus();
    const estimatedWait = processingQueue.getEstimatedWait();

    return NextResponse.json({
        // Combined view for frontend
        active: processStatus.active + downloadStatus.active + imageStatus.active,
        queued: processStatus.queued + downloadStatus.queued + imageStatus.queued,
        maxConcurrent: processStatus.maxConcurrent + imageStatus.maxConcurrent,
        estimatedWaitSeconds: estimatedWait,

        // System health
        serverLoad: allStatus.overallHealth === "critical" ? "HIGH" :
            allStatus.overallHealth === "degraded" ? "MEDIUM" : "LOW",
        health: allStatus.overallHealth,
        canAcceptRequests: canAcceptRequests(),

        // Detailed breakdown
        processing: processStatus,
        downloads: downloadStatus,
        images: imageStatus,

        // Totals
        totalProcessed: processStatus.totalProcessed + downloadStatus.totalProcessed + imageStatus.totalProcessed,
        totalTimeouts: processStatus.totalTimeouts + downloadStatus.totalTimeouts + imageStatus.totalTimeouts,
    });
}
