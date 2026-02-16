/**
 * FFmpeg Worker Pool
 * Manages concurrent FFmpeg processes with timeouts and error handling
 */

import { spawn, ChildProcess } from "child_process";
import { existsSync } from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Maximum concurrent FFmpeg processes
const MAX_CONCURRENT = parseInt(process.env.FFMPEG_CONCURRENCY || "2", 10);

// Timeouts
const IMAGE_TIMEOUT = 30000; // 30 seconds for images
const VIDEO_TIMEOUT = 180000; // 3 minutes for videos

// FFmpeg binary paths
let FFMPEG_PATH = "ffmpeg";
let FFPROBE_PATH = "ffprobe";

// Configure paths based on environment
function configurePaths() {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
        // Docker container paths (apt-get install location)
        FFMPEG_PATH = "/usr/bin/ffmpeg";
        FFPROBE_PATH = "/usr/bin/ffprobe";
    } else {
        // Development - try to use ffmpeg-static
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const ffmpegStatic = require("ffmpeg-static");
            if (ffmpegStatic && existsSync(ffmpegStatic)) {
                FFMPEG_PATH = ffmpegStatic;
            }

            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const ffprobeStatic = require("ffprobe-static");
            if (ffprobeStatic?.path && existsSync(ffprobeStatic.path)) {
                FFPROBE_PATH = ffprobeStatic.path;
            }
        } catch {
            console.log("[FFmpegPool] Using system ffmpeg");
        }
    }
}

configurePaths();

// ============================================================================
// WORKER POOL STATE
// ============================================================================

interface Job {
    id: string;
    type: "image" | "video";
    input: string;
    output: string;
    width: number;
    height: number;
    watermark?: boolean;
    resolve: (result: string) => void;
    reject: (error: Error) => void;
}

const activeJobs = new Map<string, ChildProcess>();
const jobQueue: Job[] = [];
let activeCount = 0;

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Build FFmpeg filter chain for scaling/padding
 */
function buildFilterChain(
    width: number,
    height: number,
    isImage: boolean,
    watermark: boolean = false
): string {
    let filter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

    if (watermark) {
        filter += `,drawtext=text='[RACIO]':fontsize=18:fontcolor=white@0.6:x=w-tw-12:y=h-th-12:shadowcolor=black@0.4:shadowx=1:shadowy=1`;
    }

    return filter;
}

/**
 * Process a single job
 */
function processJob(job: Job): void {
    const isImage = job.type === "image";
    const timeout = isImage ? IMAGE_TIMEOUT : VIDEO_TIMEOUT;

    const args: string[] = [
        "-i", job.input,
        "-vf", buildFilterChain(job.width, job.height, isImage, job.watermark),
    ];

    if (isImage) {
        // Image-specific options
        args.push(
            "-y",
            "-q:v", "2", // High quality JPEG
            job.output
        );
    } else {
        // Video-specific options
        args.push(
            "-preset", "ultrafast",
            "-crf", "23",
            "-movflags", "+faststart",
            "-threads", "0",
            "-c:v", "libx264",
            "-c:a", "aac",
            "-b:a", "128k",
            "-y",
            job.output
        );
    }

    console.log(`[FFmpegPool] Starting job ${job.id}: ${job.type} ${job.width}x${job.height}`);

    const proc = spawn(FFMPEG_PATH, args);
    activeJobs.set(job.id, proc);

    let stderr = "";
    let completed = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
        if (!completed) {
            console.error(`[FFmpegPool] Job ${job.id} timed out after ${timeout}ms`);
            proc.kill("SIGTERM");
            setTimeout(() => {
                if (!completed) proc.kill("SIGKILL");
            }, 5000);
        }
    }, timeout);

    proc.stderr?.on("data", (data) => {
        stderr += data.toString();
    });

    proc.on("close", (code) => {
        completed = true;
        clearTimeout(timeoutId);
        activeJobs.delete(job.id);
        activeCount--;

        if (code === 0) {
            console.log(`[FFmpegPool] Job ${job.id} completed successfully`);
            job.resolve(job.output);
        } else {
            const errorMsg = stderr.slice(-500);
            console.error(`[FFmpegPool] Job ${job.id} failed with code ${code}: ${errorMsg}`);
            job.reject(new Error(`FFmpeg failed (code ${code}): ${errorMsg}`));
        }

        // Process next job in queue
        processNextJob();
    });

    proc.on("error", (err) => {
        completed = true;
        clearTimeout(timeoutId);
        activeJobs.delete(job.id);
        activeCount--;

        console.error(`[FFmpegPool] Job ${job.id} spawn error:`, err);
        job.reject(new Error(`FFmpeg spawn error: ${err.message}`));

        processNextJob();
    });
}

/**
 * Process next job from queue
 */
function processNextJob(): void {
    while (activeCount < MAX_CONCURRENT && jobQueue.length > 0) {
        const job = jobQueue.shift()!;
        activeCount++;
        processJob(job);
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Run an FFmpeg job with the worker pool
 */
export function runJob(options: {
    id: string;
    type: "image" | "video";
    input: string;
    output: string;
    width: number;
    height: number;
    watermark?: boolean;
}): Promise<string> {
    return new Promise((resolve, reject) => {
        const job: Job = {
            ...options,
            resolve,
            reject,
        };

        if (activeCount < MAX_CONCURRENT) {
            activeCount++;
            processJob(job);
        } else {
            console.log(`[FFmpegPool] Job ${job.id} queued (${jobQueue.length + 1} in queue)`);
            jobQueue.push(job);
        }
    });
}

/**
 * Get probe data for a file
 */
export function probe(filePath: string): Promise<{
    width: number;
    height: number;
    duration?: number;
    format?: string;
}> {
    return new Promise((resolve, reject) => {
        const args = [
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            "-show_format",
            filePath
        ];

        const proc = spawn(FFPROBE_PATH, args);
        let stdout = "";
        let stderr = "";

        proc.stdout?.on("data", (data) => { stdout += data.toString(); });
        proc.stderr?.on("data", (data) => { stderr += data.toString(); });

        const timeout = setTimeout(() => {
            proc.kill();
            reject(new Error("Probe timed out"));
        }, 10000);

        proc.on("close", (code) => {
            clearTimeout(timeout);

            if (code !== 0) {
                resolve({ width: 1920, height: 1080 }); // Default on error
                return;
            }

            try {
                const data = JSON.parse(stdout);
                const videoStream = data.streams?.find((s: any) => s.codec_type === "video");

                resolve({
                    width: videoStream?.width || 1920,
                    height: videoStream?.height || 1080,
                    duration: parseFloat(data.format?.duration) || undefined,
                    format: videoStream?.codec_name,
                });
            } catch {
                resolve({ width: 1920, height: 1080 });
            }
        });

        proc.on("error", () => {
            clearTimeout(timeout);
            resolve({ width: 1920, height: 1080 });
        });
    });
}

/**
 * Get pool status
 */
export function getPoolStatus(): {
    active: number;
    queued: number;
    maxConcurrent: number;
} {
    return {
        active: activeCount,
        queued: jobQueue.length,
        maxConcurrent: MAX_CONCURRENT,
    };
}

/**
 * Kill all active jobs (for shutdown)
 */
export function killAllJobs(): void {
    console.log(`[FFmpegPool] Killing ${activeJobs.size} active jobs`);
    for (const [id, proc] of activeJobs) {
        proc.kill("SIGTERM");
    }
    activeJobs.clear();
    jobQueue.length = 0;
    activeCount = 0;
}
