import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";

// Validate Twitter/X URL
function isValidTwitterUrl(url: string): boolean {
    const patterns = [
        /^https?:\/\/(www\.)?(twitter|x)\.com\/\w+\/status\/\d+/,
        /^https?:\/\/(www\.)?t\.co\/\w+/,
    ];
    return patterns.some(p => p.test(url));
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        if (!url || typeof url !== "string") {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        if (!isValidTwitterUrl(url)) {
            return NextResponse.json({ error: "Invalid Twitter/X URL" }, { status: 400 });
        }

        // Setup workspace
        const sessionId = uuidv4();
        const tempDir = path.join(os.tmpdir(), "racio", sessionId);
        await mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, "input.mp4");

        // Download video using system yt-dlp
        await new Promise<void>((resolve, reject) => {
            const args = [
                url,
                "-o", outputPath,
                "-f", "best[ext=mp4]/best",
                "--no-playlist",
                "--no-check-certificate",
                "--retries", "3"
            ];

            const process = spawn("yt-dlp", args);

            process.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`yt-dlp exited with code ${code}`));
            });

            process.on("error", (err) => {
                reject(err);
            });
        });

        // Now forward to the processing endpoint
        return NextResponse.json({
            success: true,
            sessionId,
            tempPath: outputPath,
            message: "Video downloaded. Ready for processing.",
        });

    } catch (error: any) {
        console.error("Download error:", error);

        return NextResponse.json({
            error: error.message || "Failed to download video"
        }, { status: 500 });
    }
}
