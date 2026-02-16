import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, stat, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import { cleanupOldSessions } from "@/lib/cleanup";
import { processingQueue } from "@/lib/queue";

// Configure FFmpeg paths
// In production (Docker), use system ffmpeg
// In development, use ffmpeg-static
function configureFfmpeg() {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
        // Use system FFmpeg in Docker
        ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");
        ffmpeg.setFfprobePath("/usr/local/bin/ffprobe");
    } else {
        // Use static binaries in development
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const ffmpegPath = require("ffmpeg-static");
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const ffprobePath = require("ffprobe-static").path;

            if (ffmpegPath && existsSync(ffmpegPath)) {
                ffmpeg.setFfmpegPath(ffmpegPath);
            }
            if (ffprobePath && existsSync(ffprobePath)) {
                ffmpeg.setFfprobePath(ffprobePath);
            }
        } catch (e) {
            console.warn("Could not load ffmpeg-static, using system ffmpeg");
        }
    }
}

configureFfmpeg();

function getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
            if (err) reject(err);
            else resolve(metadata.streams.find((s: any) => s.width && s.height));
        });
    });
}

// Detect if input is an image based on extension
function isImageFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"];
    return imageExts.includes(ext);
}

// Process image with FFmpeg
function processImage({
    input,
    output,
    width,
    height,
    addWatermark = false,
}: {
    input: string;
    output: string;
    width: number;
    height: number;
    addWatermark?: boolean;
}): Promise<string> {
    return new Promise((resolve, reject) => {
        let filterChain = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

        if (addWatermark) {
            filterChain += `,drawtext=text='[RACIO]':fontsize=18:fontcolor=white@0.6:x=w-tw-12:y=h-th-12:shadowcolor=black@0.4:shadowx=1:shadowy=1`;
        }

        ffmpeg(input)
            .outputOptions([
                '-vf', filterChain,
                '-q:v', '2', // High quality JPEG
                '-y',
            ])
            .output(output)
            .on("end", () => resolve(output))
            .on("error", (err: any) => reject(err))
            .run();
    });
}

// FFmpeg processing timeout (120 seconds per video)
const FFMPEG_TIMEOUT = 120000;

// Helper to process video - OPTIMIZED for speed with timeout protection
function processVideo({
    input,
    output,
    width,
    height,
    pad = false,
    addWatermark = false,
}: {
    input: string;
    output: string;
    width: number;
    height: number;
    pad?: boolean;
    addWatermark?: boolean;
}): Promise<string> {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(input);
        let completed = false;

        // Timeout protection - kill FFmpeg after 120 seconds
        const timeout = setTimeout(() => {
            if (!completed) {
                command.kill('SIGTERM');
                reject(new Error("Video processing timed out. Try a shorter video."));
            }
        }, FFMPEG_TIMEOUT);

        // FIT mode with black padding - clean, professional look
        // Preserves all content, no cropping, black bars fill empty space
        let filterChain: string[];

        // Scale to fit within target, then pad with black to exact dimensions
        if (addWatermark) {
            filterChain = [
                `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='[RACIO]':fontsize=18:fontcolor=white@0.6:x=w-tw-12:y=h-th-12:shadowcolor=black@0.4:shadowx=1:shadowy=1`,
            ];
        } else {
            filterChain = [
                `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
            ];
        }

        command.complexFilter(filterChain);

        command
            .outputOptions([
                '-preset ultrafast',      // Fastest encoding
                '-crf 23',                // Good quality (18-28, lower = better)
                '-movflags +faststart',   // Web optimization
                '-threads 0',             // Use all available threads
                '-y',                     // Overwrite output
            ])
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioBitrate('128k')
            .output(output)
            .on("end", () => {
                completed = true;
                clearTimeout(timeout);
                resolve(output);
            })
            .on("error", (err: any) => {
                completed = true;
                clearTimeout(timeout);
                reject(err);
            })
            .run();
    });
}


export async function POST(req: NextRequest) {
    // Generate request ID for queue tracking
    const requestId = uuidv4().slice(0, 8);
    let releaseQueue: (() => void) | null = null;

    try {
        // Acquire queue slot (will wait if server is busy)
        releaseQueue = await processingQueue.acquire(requestId);

        // Trigger cleanup of old sessions (non-blocking)
        cleanupOldSessions().catch(() => { });



        const contentType = req.headers.get("content-type") || "";

        let inputPath: string;
        let sessionId: string;
        let tempDir: string;
        let isPro = false; // Default: add watermark for free users
        let ratios: string[] = ["9:16", "1:1", "16:9"]; // Default ratios
        let sourceType: "FILE_UPLOAD" | "URL_DOWNLOAD" = "FILE_UPLOAD";

        // Ratio configuration for FREE users (720p)
        const RATIO_CONFIG_FREE: Record<string, { width: number; height: number; name: string; padForVertical: boolean }> = {
            "9:16": { width: 720, height: 1280, name: "reel_9-16", padForVertical: true },
            "1:1": { width: 720, height: 720, name: "feed_1-1", padForVertical: false },
            "16:9": { width: 1280, height: 720, name: "landscape_16-9", padForVertical: true },
            "4:5": { width: 720, height: 900, name: "portrait_4-5", padForVertical: false },
            "2:3": { width: 720, height: 1080, name: "portrait_2-3", padForVertical: false },
            "21:9": { width: 1260, height: 540, name: "ultrawide_21-9", padForVertical: true },
        };

        // Ratio configuration for PRO/LIFETIME users (1080p)
        const RATIO_CONFIG_PRO: Record<string, { width: number; height: number; name: string; padForVertical: boolean }> = {
            "9:16": { width: 1080, height: 1920, name: "reel_9-16_1080p", padForVertical: true },
            "1:1": { width: 1080, height: 1080, name: "feed_1-1_1080p", padForVertical: false },
            "16:9": { width: 1920, height: 1080, name: "landscape_16-9_1080p", padForVertical: true },
            "4:5": { width: 1080, height: 1350, name: "portrait_4-5_1080p", padForVertical: false },
            "2:3": { width: 1080, height: 1620, name: "portrait_2-3_1080p", padForVertical: false },
            "21:9": { width: 2520, height: 1080, name: "ultrawide_21-9_1080p", padForVertical: true },
        };

        if (contentType.includes("multipart/form-data")) {
            // Handle file upload
            const formData = await req.formData();
            const file = formData.get("file") as File;
            isPro = formData.get("isPro") === "true";
            const ratiosStr = formData.get("ratios") as string;
            if (ratiosStr) {
                try {
                    ratios = JSON.parse(ratiosStr);
                } catch (e) {
                    // Keep default ratios
                }
            }

            if (!file) {
                return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
            }

            sessionId = uuidv4();
            tempDir = path.join(os.tmpdir(), "racio", sessionId);
            await mkdir(tempDir, { recursive: true });

            inputPath = path.join(tempDir, `input${path.extname(file.name)}`);
            const buffer = Buffer.from(await file.arrayBuffer());
            await writeFile(inputPath, buffer);
        } else {
            // Handle JSON request (from URL fetch)
            const body = await req.json();
            const { tempPath, sessionId: existingSessionId, isPro: isProFromBody, ratios: ratiosFromBody } = body;
            sourceType = "URL_DOWNLOAD";
            isPro = isProFromBody === true;
            if (Array.isArray(ratiosFromBody) && ratiosFromBody.length > 0) {
                ratios = ratiosFromBody;
            }

            if (!tempPath || !existingSessionId) {
                return NextResponse.json(
                    { error: "Missing tempPath or sessionId" },
                    { status: 400 }
                );
            }

            // Validate path exists
            try {
                await stat(tempPath);
            } catch {
                return NextResponse.json(
                    { error: "Downloaded file not found" },
                    { status: 404 }
                );
            }

            sessionId = existingSessionId;
            tempDir = path.join(os.tmpdir(), "racio", sessionId);
            inputPath = tempPath;
        }

        // Analyze Input
        let metadata;
        try {
            metadata = await getVideoMetadata(inputPath);
        } catch (e) {
            console.warn("Probe failed, defaulting to landscape assumptions", e);
            metadata = { width: 1920, height: 1080 };
        }

        const width = metadata.width || 1920;
        const height = metadata.height || 1080;
        const isVertical = height > width;

        // Build targets from selected ratios - Use 1080p for Pro/Lifetime, 720p for Free
        const RATIO_CONFIG = isPro ? RATIO_CONFIG_PRO : RATIO_CONFIG_FREE;

        const targets = ratios
            .filter(r => RATIO_CONFIG[r]) // Only process valid ratios
            .map(r => {
                const config = RATIO_CONFIG[r];
                return {
                    name: config.name,
                    width: config.width,
                    height: config.height,
                    pad: config.padForVertical && !isVertical, // Only pad if converting to different aspect
                };
            });

        // Ensure at least one target
        if (targets.length === 0) {
            targets.push({
                name: "reel_9-16",
                width: 720,
                height: 1280,
                pad: !isVertical,
            });
        }

        // Detect if input is image or video
        const isImage = isImageFile(inputPath);
        const fileExt = isImage ? ".jpg" : ".mp4";

        // Process SEQUENTIALLY (not parallel) - reduces CPU pressure for multiple users
        // Add watermark for free users only
        const addWatermark = !isPro;
        const results: { name: string; path: string }[] = [];

        for (const t of targets) {
            const outputPath = path.join(tempDir, `${t.name}${fileExt}`);

            if (isImage) {
                // Image processing
                await processImage({
                    input: inputPath,
                    output: outputPath,
                    width: t.width,
                    height: t.height,
                    addWatermark,
                });
            } else {
                // Video processing
                await processVideo({
                    input: inputPath,
                    output: outputPath,
                    width: t.width,
                    height: t.height,
                    pad: t.pad,
                    addWatermark,
                });
            }
            results.push({ name: t.name, path: outputPath });
        }

        // 📊 Usage Analytics Log (visible in Railway logs)
        const analyticsLog = {
            event: isImage ? "IMAGE_PROCESSED" : "VIDEO_PROCESSED",
            timestamp: new Date().toISOString(),
            sessionId,
            source: sourceType,
            formats: ratios,
            formatCount: ratios.length,
            userType: isPro ? "PRO" : "FREE",
            filesGenerated: results.length,
        };
        console.log("📊 RACIO_ANALYTICS:", JSON.stringify(analyticsLog));

        // Release queue slot before returning
        if (releaseQueue) releaseQueue();

        return NextResponse.json({
            sessionId,
            files: results.map((r) => ({
                name: r.name,
                url: `/api/download?id=${sessionId}&file=${path.basename(r.path)}`,
            })),
        });
    } catch (error: any) {
        // Release queue slot on error
        if (releaseQueue) releaseQueue();
        console.error("Processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
