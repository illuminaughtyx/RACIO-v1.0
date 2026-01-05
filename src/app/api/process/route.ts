import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, stat, copyFile } from "fs/promises";
import { createWriteStream, existsSync } from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import archiver from "archiver";
import { cleanupOldSessions } from "@/lib/cleanup";

// Configure FFmpeg paths
// In production (Docker), use system ffmpeg
// In development, use ffmpeg-static
function configureFfmpeg() {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
        // Use system FFmpeg in Docker
        ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
        ffmpeg.setFfprobePath("/usr/bin/ffprobe");
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

// Helper to get video metadata
function getVideoMetadata(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err: any, metadata: any) => {
            if (err) reject(err);
            else resolve(metadata.streams.find((s: any) => s.width && s.height));
        });
    });
}

// Helper to process video
function processVideo({
    input,
    output,
    width,
    height,
    pad = false,
}: {
    input: string;
    output: string;
    width: number;
    height: number;
    pad?: boolean;
}): Promise<string> {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(input);

        if (pad) {
            // Logic for blurred background padding
            command.complexFilter([
                `split[main][blur]`,
                `[blur]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},boxblur=20:10[bg]`,
                `[main]scale=${width}:${height}:force_original_aspect_ratio=decrease[ov]`,
                `[bg][ov]overlay=(W-w)/2:(H-h)/2`,
            ]);
        } else {
            // Logic for Center Crop
            command.complexFilter([
                `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
            ]);
        }

        command
            .output(output)
            .on("end", () => resolve(output))
            .on("error", (err: any) => reject(err))
            .run();
    });
}

export async function POST(req: NextRequest) {
    try {
        // Trigger cleanup of old sessions (non-blocking)
        cleanupOldSessions().catch(() => { });

        const contentType = req.headers.get("content-type") || "";

        let inputPath: string;
        let sessionId: string;
        let tempDir: string;

        if (contentType.includes("multipart/form-data")) {
            // Handle file upload
            const formData = await req.formData();
            const file = formData.get("file") as File;

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
            const { tempPath, sessionId: existingSessionId } = body;

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

        // Smart Strategy
        const targets = [];

        // 1. 9:16 (Reels/Shorts)
        targets.push({
            name: "reel_9-16",
            width: 1080,
            height: 1920,
            pad: isVertical,
        });

        // 2. 1:1 (Feed)
        targets.push({
            name: "feed_1-1",
            width: 1080,
            height: 1080,
            pad: false,
        });

        // 3. 16:9 (YouTube)
        targets.push({
            name: "landscape_16-9",
            width: 1920,
            height: 1080,
            pad: true,
        });

        // Process in parallel
        const promises = targets.map((t) => {
            const outputPath = path.join(tempDir, `${t.name}.mp4`);
            return processVideo({
                input: inputPath,
                output: outputPath,
                width: t.width,
                height: t.height,
                pad: t.pad,
            }).then(() => ({ name: t.name, path: outputPath }));
        });

        const results = await Promise.all(promises);

        // Create ZIP
        const zipPath = path.join(tempDir, "racio-bundle.zip");
        const output = createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        await new Promise<void>((resolve, reject) => {
            output.on("close", () => resolve());
            archive.on("error", reject);
            archive.pipe(output);
            results.forEach((r) => {
                archive.file(r.path, { name: `${r.name}.mp4` });
            });
            archive.finalize();
        });

        return NextResponse.json({
            sessionId,
            zip: `/api/download?id=${sessionId}&file=racio-bundle.zip`,
            files: results.map((r) => ({
                name: r.name,
                url: `/api/download?id=${sessionId}&file=${path.basename(r.path)}`,
            })),
        });
    } catch (error: any) {
        console.error("Processing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
