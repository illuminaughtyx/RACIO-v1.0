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
        /^https?:\/\/(www\.)?(twitter|x)\.com\/i\/status\/\d+/,
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
            return NextResponse.json({ error: "Invalid Twitter/X URL. Please paste a direct tweet link." }, { status: 400 });
        }

        // Setup workspace
        const sessionId = uuidv4();
        const tempDir = path.join(os.tmpdir(), "racio", sessionId);
        await mkdir(tempDir, { recursive: true });

        const outputPath = path.join(tempDir, "input.mp4");

        // Download video using system yt-dlp with improved options
        await new Promise<void>((resolve, reject) => {
            const args = [
                url,
                "-o", outputPath,
                "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
                "--no-playlist",
                "--no-check-certificate",
                "--retries", "5",
                "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "--extractor-args", "twitter:api=syndication",
                "--socket-timeout", "30",
            ];

            const process = spawn("yt-dlp", args);

            let stderr = "";

            process.stderr?.on("data", (data) => {
                stderr += data.toString();
            });

            process.on("close", (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    // Check for common error messages
                    if (stderr.includes("Private video") || stderr.includes("protected")) {
                        reject(new Error("This video is private or protected"));
                    } else if (stderr.includes("This tweet is unavailable") || stderr.includes("No video")) {
                        reject(new Error("No video found in this tweet"));
                    } else if (stderr.includes("rate limit") || stderr.includes("429")) {
                        reject(new Error("X/Twitter rate limit reached. Please try again later."));
                    } else {
                        reject(new Error("Failed to download video. The tweet may be private or no longer available."));
                    }
                }
            });

            process.on("error", (err) => {
                reject(new Error("Download service unavailable. Please try again."));
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
