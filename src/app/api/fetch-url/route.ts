import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import ytdlp from "yt-dlp-exec";

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

        // Download video using yt-dlp
        // yt-dlp automatically handles Twitter/X videos
        await ytdlp(url, {
            output: outputPath,
            format: "best[ext=mp4]/best", // Prefer MP4
            noPlaylist: true,
            noCheckCertificate: true,
            // Additional options for reliability
            retries: 3,
            // No watermarks - Twitter doesn't add them but some wrappers do
        });

        // Now forward to the processing endpoint
        // We return the sessionId and path so the client can trigger processing
        return NextResponse.json({
            success: true,
            sessionId,
            tempPath: outputPath,
            message: "Video downloaded. Ready for processing.",
        });

    } catch (error: any) {
        console.error("Download error:", error);

        // Provide helpful error messages
        if (error.message?.includes("not found") || error.message?.includes("yt-dlp")) {
            return NextResponse.json({
                error: "yt-dlp not installed. Please install it: https://github.com/yt-dlp/yt-dlp"
            }, { status: 500 });
        }

        if (error.message?.includes("Private") || error.message?.includes("protected")) {
            return NextResponse.json({
                error: "This video is private or from a protected account."
            }, { status: 403 });
        }

        return NextResponse.json({
            error: error.message || "Failed to download video"
        }, { status: 500 });
    }
}
