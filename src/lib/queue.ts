/**
 * Simple In-Memory Processing Queue
 * Limits concurrent video processing to prevent server overload
 */

interface QueueItem {
    id: string;
    resolve: (value: void) => void;
    timestamp: number;
}

class ProcessingQueue {
    private queue: QueueItem[] = [];
    private activeCount = 0;
    private maxConcurrent = 2; // Max videos processing at once
    private maxQueueSize = 20; // Max waiting in queue

    /**
     * Wait for a slot to process
     * Returns a release function to call when done
     */
    async acquire(requestId: string): Promise<() => void> {
        // If we have capacity, process immediately
        if (this.activeCount < this.maxConcurrent) {
            this.activeCount++;
            console.log(`🎬 [Queue] Processing started: ${requestId} (active: ${this.activeCount}/${this.maxConcurrent})`);
            return () => this.release(requestId);
        }

        // Check queue size limit
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error("Server is busy. Please try again in a few minutes.");
        }

        // Wait in queue
        const position = this.queue.length + 1;
        console.log(`⏳ [Queue] Request queued: ${requestId} (position: ${position})`);

        await new Promise<void>((resolve) => {
            this.queue.push({
                id: requestId,
                resolve,
                timestamp: Date.now(),
            });
        });

        this.activeCount++;
        console.log(`🎬 [Queue] Processing started (from queue): ${requestId} (active: ${this.activeCount}/${this.maxConcurrent})`);
        return () => this.release(requestId);
    }

    private release(requestId: string): void {
        this.activeCount--;
        console.log(`✅ [Queue] Processing complete: ${requestId} (active: ${this.activeCount}/${this.maxConcurrent})`);

        // Process next in queue
        if (this.queue.length > 0) {
            const next = this.queue.shift()!;
            console.log(`➡️ [Queue] Next up: ${next.id} (waited: ${Date.now() - next.timestamp}ms)`);
            next.resolve();
        }
    }

    /**
     * Get current queue status
     */
    getStatus(): { active: number; queued: number; maxConcurrent: number } {
        return {
            active: this.activeCount,
            queued: this.queue.length,
            maxConcurrent: this.maxConcurrent,
        };
    }

    /**
     * Get estimated wait time in seconds
     */
    getEstimatedWait(): number {
        const avgProcessingTime = 15; // seconds per video
        if (this.activeCount < this.maxConcurrent) return 0;
        return Math.ceil((this.queue.length + 1) * avgProcessingTime / this.maxConcurrent);
    }
}

// Singleton instances
export const processingQueue = new ProcessingQueue();

// Separate queue for URL downloads (yt-dlp)
// Lower concurrency since yt-dlp uses network + can hit rate limits
export const downloadQueue = new ProcessingQueue();
// Override settings for download queue
(downloadQueue as any).maxConcurrent = 2;
(downloadQueue as any).maxQueueSize = 10;
