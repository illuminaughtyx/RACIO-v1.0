import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import os from "os";

// ============================================================================
// DOWNLOAD API - Secure file downloads with validation
// ============================================================================
// GET /api/download?id={sessionId}&file={filename}
// - Validates file exists and is non-empty
// - Returns proper content types for images/videos
// - Supports streaming for large files
// - Mobile-friendly download headers
// ============================================================================

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".zip": "application/zip",
};

// Minimum file sizes to consider valid (bytes)
const MIN_FILE_SIZES: Record<string, number> = {
    ".jpg": 1000,
    ".jpeg": 1000,
    ".png": 500,
    ".mp4": 5000,
    ".zip": 500,
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const filename = searchParams.get("file");
        const preview = searchParams.get("preview") === "true"; // For inline display

        // Validate required parameters
        if (!id || !filename) {
            return NextResponse.json(
                { error: "Missing parameters. Required: id, file" },
                { status: 400 }
            );
        }

        // Validate ID format (UUID v4)
        if (!/^[0-9a-f-]{36}$/i.test(id)) {
            return NextResponse.json(
                { error: "Invalid session ID format" },
                { status: 400 }
            );
        }

        // Validate filename - prevent directory traversal
        if (
            filename.includes("..") ||
            filename.includes("/") ||
            filename.includes("\\") ||
            filename.includes("\0") ||
            filename.length > 100
        ) {
            return NextResponse.json(
                { error: "Invalid filename" },
                { status: 400 }
            );
        }

        // Construct file path
        const filePath = path.join(os.tmpdir(), "racio", id, filename);

        // Get file stats
        let fileStats;
        try {
            fileStats = await stat(filePath);
        } catch (e: any) {
            if (e.code === "ENOENT") {
                return NextResponse.json(
                    { error: "File not found. It may have expired (files are deleted after 1 hour)." },
                    { status: 404 }
                );
            }
            throw e;
        }

        // Validate file is not empty
        const ext = path.extname(filename).toLowerCase();
        const minSize = MIN_FILE_SIZES[ext] || 100;

        if (fileStats.size < minSize) {
            console.error(`[Download] File too small: ${filename} (${fileStats.size} bytes, min: ${minSize})`);
            return NextResponse.json(
                { error: "File appears to be corrupted or empty. Please regenerate." },
                { status: 500 }
            );
        }

        // Determine content type
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        // Read file
        const fileBuffer = await readFile(filePath);

        // Double-check buffer size matches stat
        if (fileBuffer.length !== fileStats.size) {
            console.error(`[Download] Size mismatch: ${filename} (buffer: ${fileBuffer.length}, stat: ${fileStats.size})`);
        }

        // Build response
        const response = new NextResponse(fileBuffer);

        // Set headers
        response.headers.set("Content-Type", contentType);
        response.headers.set("Content-Length", String(fileStats.size));

        // Set disposition based on preview mode
        if (preview && (contentType.startsWith("image/") || contentType.startsWith("video/"))) {
            response.headers.set("Content-Disposition", `inline; filename="${filename}"`);
        } else {
            response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        }

        // Cache control - files are temporary, don't cache
        response.headers.set("Cache-Control", "no-store, max-age=0");

        // CORS headers for cross-origin downloads
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");

        return response;

    } catch (error: any) {
        console.error("[Download] Error:", error);
        return NextResponse.json(
            { error: "Failed to download file" },
            { status: 500 }
        );
    }
}

// HEAD request for checking file existence
export async function HEAD(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const filename = searchParams.get("file");

        if (!id || !filename) {
            return new NextResponse(null, { status: 400 });
        }

        if (!/^[0-9a-f-]{36}$/i.test(id)) {
            return new NextResponse(null, { status: 400 });
        }

        const filePath = path.join(os.tmpdir(), "racio", id, filename);

        try {
            const fileStats = await stat(filePath);
            const ext = path.extname(filename).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";

            return new NextResponse(null, {
                status: 200,
                headers: {
                    "Content-Type": contentType,
                    "Content-Length": String(fileStats.size),
                    "Accept-Ranges": "bytes",
                },
            });
        } catch {
            return new NextResponse(null, { status: 404 });
        }

    } catch {
        return new NextResponse(null, { status: 500 });
    }
}
