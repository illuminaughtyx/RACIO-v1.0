import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, stat, readFile } from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import { processingQueue } from "@/lib/queue";
import { cleanupOldSessions } from "@/lib/cleanup";

// ============================================================================
// RACIO CONVERT API - Image-First Architecture
// ============================================================================
// POST /api/convert
// Body: { url, type: "image"|"video", formats: ["1:1","9:16",...] }
// Response: 
//   - Fast jobs (images): { results: [{ format, url }] }
//   - Long jobs (video): { jobId, statusUrl }
// ============================================================================

// Rate limiting state (simple in-memory, use Redis in prod)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = { maxRequests: 10, windowMs: 60000 }; // 10 per minute

// Processing timeout
const IMAGE_TIMEOUT = 30000; // 30 seconds for images
const VIDEO_TIMEOUT = 120000; // 120 seconds for video

// Supported formats configuration
const FORMAT_CONFIG: Record<string, { width: number; height: number; name: string }> = {
    "9:16": { width: 1080, height: 1920, name: "vertical_9-16" },
    "1:1": { width: 1080, height: 1080, name: "square_1-1" },
    "16:9": { width: 1920, height: 1080, name: "landscape_16-9" },
    "4:5": { width: 1080, height: 1350, name: "portrait_4-5" },
    "2:3": { width: 1080, height: 1620, name: "pinterest_2-3" },
    "21:9": { width: 2520, height: 1080, name: "ultrawide_21-9" },
};

// Safe JSON body parser
async function parseBody(req: NextRequest): Promise<{ url?: string; type?: string; formats?: string[]; file?: string } | null> {
    try {
        const contentType = req.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            const text = await req.text();
            if (!text || text.trim() === "") {
                return null;
            }
            return JSON.parse(text);
        }

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            const file = formData.get("file") as File | null;
            const type = formData.get("type") as string || "image";
            const formatsStr = formData.get("formats") as string;
            let formats = ["9:16", "1:1", "16:9"];

            if (formatsStr) {
                try {
                    formats = JSON.parse(formatsStr);
                } catch {
                    // Keep defaults
                }
            }

            if (file) {
                // Save file to temp location
                const sessionId = uuidv4();
                const tempDir = path.join(os.tmpdir(), "racio", sessionId);
                await mkdir(tempDir, { recursive: true });

                const ext = path.extname(file.name) || (type === "image" ? ".jpg" : ".mp4");
                const inputPath = path.join(tempDir, `input${ext}`);
                const buffer = Buffer.from(await file.arrayBuffer());
                await writeFile(inputPath, buffer);

                return {
                    file: inputPath,
                    type,
                    formats,
                };
            }
        }

        return null;
    } catch (e) {
        console.error("[Convert] Body parse error:", e);
        return null;
    }
}

// Check rate limit
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const record = rateLimiter.get(ip);

    if (!record || now > record.resetAt) {
        rateLimiter.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
        return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
    }

    if (record.count >= RATE_LIMIT.maxRequests) {
        return { allowed: false, remaining: 0 };
    }

    record.count++;
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

// Detect if input is an image or video based on extension
function detectMediaType(filePath: string): "image" | "video" {
    const ext = path.extname(filePath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"];
    return imageExts.includes(ext) ? "image" : "video";
}

// Get image metadata using FFprobe
async function getImageMetadata(filePath: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const args = [
            "-v", "quiet",
            "-print_format", "json",
            "-show_streams",
            filePath
        ];

        const proc = spawn("ffprobe", args);
        let stdout = "";
        let stderr = "";

        proc.stdout?.on("data", (data) => { stdout += data.toString(); });
        proc.stderr?.on("data", (data) => { stderr += data.toString(); });

        proc.on("close", (code) => {
            if (code === 0) {
                try {
                    const data = JSON.parse(stdout);
                    const stream = data.streams?.find((s: any) => s.width && s.height);
                    if (stream) {
                        resolve({ width: stream.width, height: stream.height });
                    } else {
                        resolve({ width: 1920, height: 1080 }); // Default
                    }
                } catch {
                    resolve({ width: 1920, height: 1080 });
                }
            } else {
                resolve({ width: 1920, height: 1080 }); // Default on error
            }
        });

        proc.on("error", () => {
            resolve({ width: 1920, height: 1080 });
        });

        // Timeout
        setTimeout(() => {
            proc.kill();
            resolve({ width: 1920, height: 1080 });
        }, 5000);
    });
}

// Process image with FFmpeg - pad to fit aspect ratio
async function processImage(
    input: string,
    output: string,
    width: number,
    height: number,
    addWatermark: boolean = false
): Promise<string> {
    return new Promise((resolve, reject) => {
        // Build filter chain: scale to fit, pad with black bars
        let filterChain = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

        if (addWatermark) {
            filterChain += `,drawtext=text='[RACIO]':fontsize=18:fontcolor=white@0.6:x=w-tw-12:y=h-th-12:shadowcolor=black@0.4:shadowx=1:shadowy=1`;
        }

        const args = [
            "-i", input,
            "-vf", filterChain,
            "-y", // Overwrite
            "-q:v", "2", // High quality JPEG
            output
        ];

        const proc = spawn("ffmpeg", args);
        let stderr = "";

        proc.stderr?.on("data", (data) => { stderr += data.toString(); });

        proc.on("close", (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`FFmpeg failed: ${stderr.slice(-200)}`));
            }
        });

        proc.on("error", (err) => {
            reject(new Error(`FFmpeg spawn error: ${err.message}`));
        });

        // Timeout protection
        setTimeout(() => {
            proc.kill("SIGTERM");
            reject(new Error("Image processing timed out"));
        }, IMAGE_TIMEOUT);
    });
}

// Download image from URL
async function downloadImage(url: string, outputPath: string): Promise<void> {
    const https = await import("https");
    const http = await import("http");

    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const file = createWriteStream(outputPath);

        const request = protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    file.close();
                    downloadImage(redirectUrl, outputPath).then(resolve).catch(reject);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Download failed: HTTP ${response.statusCode}`));
                return;
            }

            response.pipe(file);

            file.on("finish", () => {
                file.close();
                resolve();
            });
        });

        request.on("error", (err) => {
            file.close();
            reject(new Error(`Download error: ${err.message}`));
        });

        // Timeout
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error("Download timed out"));
        });
    });
}

// Validate file is non-empty
async function validateFile(filePath: string): Promise<boolean> {
    try {
        const stats = await stat(filePath);
        return stats.size > 100; // At least 100 bytes
    } catch {
        return false;
    }
}



// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function POST(req: NextRequest) {
    const requestId = uuidv4().slice(0, 8);
    const startTime = Date.now();
    let releaseQueue: (() => void) | null = null;

    try {
        // Get client IP for rate limiting
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
            req.headers.get("x-real-ip") ||
            "unknown";

        // Check rate limit
        const rateCheck = checkRateLimit(ip);
        if (!rateCheck.allowed) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please try again later." },
                {
                    status: 429,
                    headers: { "Retry-After": "60" }
                }
            );
        }

        // Parse request body safely
        const body = await parseBody(req);

        if (!body) {
            return NextResponse.json(
                { error: "Invalid request body. Expected JSON with { url, type, formats } or multipart/form-data with file." },
                { status: 400 }
            );
        }

        // Extract parameters with defaults
        const { url, type = "image", formats = ["9:16", "1:1", "16:9"], file: uploadedFile } = body;

        // Validate we have either URL or file
        if (!url && !uploadedFile) {
            return NextResponse.json(
                { error: "Either 'url' or file upload is required." },
                { status: 400 }
            );
        }

        // Validate formats
        const validFormats = (formats as string[]).filter(f => FORMAT_CONFIG[f]);
        if (validFormats.length === 0) {
            return NextResponse.json(
                { error: "No valid formats specified. Available: 9:16, 1:1, 16:9, 4:5, 2:3, 21:9" },
                { status: 400 }
            );
        }

        // Acquire queue slot
        releaseQueue = await processingQueue.acquire(requestId);

        // Trigger cleanup (non-blocking)
        cleanupOldSessions().catch(() => { });

        // Setup workspace
        const sessionId = uuidv4();
        const tempDir = path.join(os.tmpdir(), "racio", sessionId);
        await mkdir(tempDir, { recursive: true });

        let inputPath: string;

        // Handle URL download or use uploaded file
        if (uploadedFile) {
            inputPath = uploadedFile;
        } else if (url) {
            // Determine extension from URL
            const urlPath = new URL(url).pathname;
            let ext = path.extname(urlPath).toLowerCase();
            if (!ext || ext.length > 5) ext = type === "image" ? ".jpg" : ".mp4";

            inputPath = path.join(tempDir, `input${ext}`);

            try {
                await downloadImage(url, inputPath);
            } catch (e: any) {
                if (releaseQueue) releaseQueue();
                return NextResponse.json(
                    { error: `Failed to download: ${e.message}` },
                    { status: 400 }
                );
            }
        } else {
            if (releaseQueue) releaseQueue();
            return NextResponse.json(
                { error: "No input source provided" },
                { status: 400 }
            );
        }

        // Validate input file
        const inputValid = await validateFile(inputPath);
        if (!inputValid) {
            if (releaseQueue) releaseQueue();
            return NextResponse.json(
                { error: "Input file is empty or invalid" },
                { status: 400 }
            );
        }

        // Detect actual media type
        const actualType = detectMediaType(inputPath);
        const isImage = actualType === "image" || type === "image";

        // Get input dimensions
        const metadata = await getImageMetadata(inputPath);

        console.log(`[Convert] ${requestId} - Processing ${isImage ? "image" : "video"}: ${validFormats.length} formats, ${metadata.width}x${metadata.height}`);

        // Process each format
        const results: { format: string; name: string; path: string; url: string }[] = [];
        const errors: string[] = [];

        for (const format of validFormats) {
            const config = FORMAT_CONFIG[format];
            const ext = isImage ? ".jpg" : ".mp4";
            const outputPath = path.join(tempDir, `${config.name}${ext}`);

            try {
                if (isImage) {
                    await processImage(
                        inputPath,
                        outputPath,
                        config.width,
                        config.height,
                        false // No watermark for now (handled by tier check)
                    );
                } else {
                    // For video, delegate to existing process API logic
                    // This is a simplified path - for full video support, use /api/process
                    await processImage(inputPath, outputPath, config.width, config.height, false);
                }

                // Validate output
                const outputValid = await validateFile(outputPath);
                if (outputValid) {
                    results.push({
                        format,
                        name: config.name,
                        path: outputPath,
                        url: `/api/download?id=${sessionId}&file=${config.name}${ext}`,
                    });
                } else {
                    errors.push(`${format}: Output validation failed`);
                }
            } catch (e: any) {
                console.error(`[Convert] ${requestId} - Format ${format} failed:`, e.message);
                errors.push(`${format}: ${e.message}`);
            }
        }

        // Check if any outputs were generated
        if (results.length === 0) {
            if (releaseQueue) releaseQueue();
            return NextResponse.json(
                { error: `Processing failed for all formats. ${errors.join("; ")}` },
                { status: 500 }
            );
        }



        // Calculate processing time
        const processingTime = Date.now() - startTime;

        // Release queue
        if (releaseQueue) releaseQueue();

        // Log analytics
        console.log(`📊 RACIO_ANALYTICS: ${JSON.stringify({
            event: "CONVERT_COMPLETE",
            requestId,
            sessionId,
            type: isImage ? "image" : "video",
            formatsRequested: validFormats.length,
            formatsGenerated: results.length,
            processingTimeMs: processingTime,
            timestamp: new Date().toISOString(),
        })}`);

        // Return response
        return NextResponse.json({
            success: true,
            sessionId,
            type: isImage ? "image" : "video",
            processingTimeMs: processingTime,
            results: results.map(r => ({
                format: r.format,
                name: r.name,
                url: r.url,
            })),
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        if (releaseQueue) releaseQueue();

        console.error(`[Convert] ${requestId} - Error:`, error);

        // Safe error response
        return NextResponse.json(
            {
                error: error.message || "An unexpected error occurred",
                requestId,
            },
            { status: 500 }
        );
    }
}

// GET handler for API info
export async function GET() {
    return NextResponse.json({
        api: "RACIO Convert API",
        version: "2.0.0",
        description: "Image-first ratio conversion engine",
        usage: {
            method: "POST",
            contentType: "application/json",
            body: {
                url: "URL to image or video (required if no file upload)",
                type: "image | video (default: image)",
                formats: "Array of aspect ratios (default: ['9:16', '1:1', '16:9'])",
            },
            availableFormats: Object.keys(FORMAT_CONFIG),
        },
        example: {
            curl: `curl -X POST ${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/convert -H "Content-Type: application/json" -d '{"url":"https://example.com/image.jpg","type":"image","formats":["1:1","9:16"]}'`,
        },
    });
}
