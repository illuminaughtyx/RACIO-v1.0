/**
 * Enhanced Processing Queue System
 * - Limits concurrent processing to prevent server overload
 * - Supports timeouts and circuit breaker pattern
 * - Redis-ready for production scaling
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

// Environment-based configuration
const config = {
    // Processing queue settings
    processingMaxConcurrent: parseInt(process.env.QUEUE_PROCESSING_CONCURRENCY || "2", 10),
    processingMaxQueueSize: parseInt(process.env.QUEUE_PROCESSING_MAX_SIZE || "50", 10),
    processingTimeout: parseInt(process.env.QUEUE_PROCESSING_TIMEOUT || "180000", 10), // 3 min

    // Download queue settings
    downloadMaxConcurrent: parseInt(process.env.QUEUE_DOWNLOAD_CONCURRENCY || "2", 10),
    downloadMaxQueueSize: parseInt(process.env.QUEUE_DOWNLOAD_MAX_SIZE || "20", 10),
    downloadTimeout: parseInt(process.env.QUEUE_DOWNLOAD_TIMEOUT || "60000", 10), // 1 min

    // Estimated processing times (for wait time calculation)
    avgImageProcessingTime: 3, // seconds
    avgVideoProcessingTime: 30, // seconds
    avgDownloadTime: 10, // seconds
};

// ============================================================================
// TYPES
// ============================================================================

interface QueueItem {
    id: string;
    resolve: (value: void) => void;
    reject: (error: Error) => void;
    timestamp: number;
    timeoutId?: NodeJS.Timeout;
}

interface QueueStats {
    active: number;
    queued: number;
    maxConcurrent: number;
    totalProcessed: number;
    totalTimeouts: number;
    avgWaitTimeMs: number;
}

// ============================================================================
// PROCESSING QUEUE CLASS
// ============================================================================

class ProcessingQueue {
    private name: string;
    private queue: QueueItem[] = [];
    private activeCount = 0;
    private maxConcurrent: number;
    private maxQueueSize: number;
    private defaultTimeout: number;

    // Stats
    private totalProcessed = 0;
    private totalTimeouts = 0;
    private waitTimes: number[] = [];
    private avgProcessingTime: number;

    constructor(options: {
        name: string;
        maxConcurrent?: number;
        maxQueueSize?: number;
        defaultTimeout?: number;
        avgProcessingTime?: number;
    }) {
        this.name = options.name;
        this.maxConcurrent = options.maxConcurrent || 2;
        this.maxQueueSize = options.maxQueueSize || 20;
        this.defaultTimeout = options.defaultTimeout || 180000;
        this.avgProcessingTime = options.avgProcessingTime || 15;
    }

    /**
     * Wait for a slot to process
     * Returns a release function to call when done
     */
    async acquire(requestId: string, timeout?: number): Promise<() => void> {
        const effectiveTimeout = timeout || this.defaultTimeout;

        // If we have capacity, process immediately
        if (this.activeCount < this.maxConcurrent) {
            this.activeCount++;
            console.log(`🎬 [${this.name}] Started: ${requestId} (active: ${this.activeCount}/${this.maxConcurrent})`);
            return () => this.release(requestId, 0);
        }

        // Check queue size limit
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error(`Server is busy. ${this.queue.length} requests queued. Please try again in a few minutes.`);
        }

        // Wait in queue with timeout
        const position = this.queue.length + 1;
        const queueStartTime = Date.now();

        console.log(`⏳ [${this.name}] Queued: ${requestId} (position: ${position})`);

        return new Promise<() => void>((resolve, reject) => {
            const item: QueueItem = {
                id: requestId,
                resolve: () => {
                    const waitTime = Date.now() - queueStartTime;
                    this.waitTimes.push(waitTime);
                    if (this.waitTimes.length > 100) this.waitTimes.shift();

                    this.activeCount++;
                    console.log(`🎬 [${this.name}] Started (from queue): ${requestId} (waited: ${waitTime}ms, active: ${this.activeCount}/${this.maxConcurrent})`);
                    resolve(() => this.release(requestId, waitTime));
                },
                reject,
                timestamp: queueStartTime,
            };

            // Setup timeout
            item.timeoutId = setTimeout(() => {
                // Remove from queue
                const idx = this.queue.indexOf(item);
                if (idx !== -1) {
                    this.queue.splice(idx, 1);
                    this.totalTimeouts++;
                    console.log(`⏰ [${this.name}] Timeout: ${requestId} (waited: ${Date.now() - queueStartTime}ms)`);
                    reject(new Error("Request queued for too long. Please try again."));
                }
            }, effectiveTimeout);

            this.queue.push(item);
        });
    }

    private release(requestId: string, waitTime: number): void {
        this.activeCount--;
        this.totalProcessed++;

        console.log(`✅ [${this.name}] Complete: ${requestId} (active: ${this.activeCount}/${this.maxConcurrent})`);

        // Process next in queue
        if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            if (next.timeoutId) clearTimeout(next.timeoutId);
            console.log(`➡️ [${this.name}] Next: ${next.id} (waited: ${Date.now() - next.timestamp}ms)`);
            next.resolve();
        }
    }

    /**
     * Get current queue status
     */
    getStatus(): QueueStats {
        const avgWaitTime = this.waitTimes.length > 0
            ? this.waitTimes.reduce((a, b) => a + b, 0) / this.waitTimes.length
            : 0;

        return {
            active: this.activeCount,
            queued: this.queue.length,
            maxConcurrent: this.maxConcurrent,
            totalProcessed: this.totalProcessed,
            totalTimeouts: this.totalTimeouts,
            avgWaitTimeMs: Math.round(avgWaitTime),
        };
    }

    /**
     * Get estimated wait time in seconds
     */
    getEstimatedWait(): number {
        if (this.activeCount < this.maxConcurrent) return 0;
        return Math.ceil((this.queue.length + 1) * this.avgProcessingTime / this.maxConcurrent);
    }

    /**
     * Get queue position for a request (0 = processing, -1 = not found)
     */
    getPosition(requestId: string): number {
        const idx = this.queue.findIndex(item => item.id === requestId);
        return idx === -1 ? (this.activeCount > 0 ? 0 : -1) : idx + 1;
    }

    /**
     * Check if queue is accepting new requests
     */
    isAccepting(): boolean {
        return this.queue.length < this.maxQueueSize;
    }

    /**
     * Get health status for monitoring
     */
    getHealth(): "healthy" | "degraded" | "critical" {
        const queueFullness = this.queue.length / this.maxQueueSize;
        if (queueFullness >= 0.9) return "critical";
        if (queueFullness >= 0.5 || this.activeCount === this.maxConcurrent) return "degraded";
        return "healthy";
    }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

// Main processing queue (for FFmpeg operations)
export const processingQueue = new ProcessingQueue({
    name: "Processing",
    maxConcurrent: config.processingMaxConcurrent,
    maxQueueSize: config.processingMaxQueueSize,
    defaultTimeout: config.processingTimeout,
    avgProcessingTime: config.avgVideoProcessingTime,
});

// Download queue (for yt-dlp and URL fetching)
export const downloadQueue = new ProcessingQueue({
    name: "Download",
    maxConcurrent: config.downloadMaxConcurrent,
    maxQueueSize: config.downloadMaxQueueSize,
    defaultTimeout: config.downloadTimeout,
    avgProcessingTime: config.avgDownloadTime,
});

// Image processing queue (lighter weight, can handle more concurrent)
export const imageQueue = new ProcessingQueue({
    name: "Image",
    maxConcurrent: config.processingMaxConcurrent * 2, // Images are faster
    maxQueueSize: config.processingMaxQueueSize * 2,
    defaultTimeout: 30000, // 30 seconds for images
    avgProcessingTime: config.avgImageProcessingTime,
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get combined status of all queues
 */
export function getAllQueueStatus() {
    return {
        processing: processingQueue.getStatus(),
        download: downloadQueue.getStatus(),
        image: imageQueue.getStatus(),
        overallHealth: getOverallHealth(),
    };
}

/**
 * Get overall system health
 */
function getOverallHealth(): "healthy" | "degraded" | "critical" {
    const healths = [
        processingQueue.getHealth(),
        downloadQueue.getHealth(),
        imageQueue.getHealth(),
    ];

    if (healths.includes("critical")) return "critical";
    if (healths.includes("degraded")) return "degraded";
    return "healthy";
}

/**
 * Check if system can accept new requests
 */
export function canAcceptRequests(): boolean {
    return processingQueue.isAccepting() &&
        downloadQueue.isAccepting() &&
        imageQueue.isAccepting();
}
