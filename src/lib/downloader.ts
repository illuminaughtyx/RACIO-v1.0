/**
 * Robust Downloader Module
 * Handles image/video downloads with streaming, timeouts, and retries
 */

import { createWriteStream } from "fs";
import { mkdir, stat, unlink } from "fs/promises";
import path from "path";
import https from "https";
import http from "http";
import { spawn } from "child_process";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_REDIRECTS = 5;
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB limit

// User agents for different sources
const USER_AGENTS = {
    default: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    twitter: "Mozilla/5.0 (compatible; TwitterBot/1.0)",
    instagram: "Instagram 219.0.0.12.117 Android",
};

// ============================================================================
// TYPES
// ============================================================================

export interface DownloadOptions {
    url: string;
    outputPath: string;
    timeout?: number;
    maxSize?: number;
    headers?: Record<string, string>;
    onProgress?: (downloaded: number, total: number | null) => void;
}

export interface DownloadResult {
    success: boolean;
    path: string;
    size: number;
    contentType?: string;
    error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detect URL source for appropriate handling
 */
function detectSource(url: string): "twitter" | "youtube" | "instagram" | "generic" {
    const urlLower = url.toLowerCase();

    if (urlLower.includes("twitter.com") || urlLower.includes("x.com") || urlLower.includes("t.co")) {
        return "twitter";
    }
    if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
        return "youtube";
    }
    if (urlLower.includes("instagram.com") || urlLower.includes("instagr.am")) {
        return "instagram";
    }

    return "generic";
}

/**
 * Get appropriate user agent for source
 */
function getUserAgent(source: string): string {
    return USER_AGENTS[source as keyof typeof USER_AGENTS] || USER_AGENTS.default;
}

/**
 * Simple HTTP/HTTPS download with redirect support
 */
async function httpDownload(
    url: string,
    outputPath: string,
    options: {
        timeout: number;
        maxSize: number;
        headers: Record<string, string>;
        onProgress?: (downloaded: number, total: number | null) => void;
        redirectCount?: number;
    }
): Promise<DownloadResult> {
    const { timeout, maxSize, headers, onProgress, redirectCount = 0 } = options;

    if (redirectCount > MAX_REDIRECTS) {
        return { success: false, path: outputPath, size: 0, error: "Too many redirects" };
    }

    return new Promise((resolve) => {
        const protocol = url.startsWith("https") ? https : http;

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        mkdir(dir, { recursive: true }).catch(() => { });

        const file = createWriteStream(outputPath);
        let downloaded = 0;
        let aborted = false;

        const request = protocol.get(url, {
            headers: {
                "User-Agent": headers["User-Agent"] || USER_AGENTS.default,
                ...headers,
            },
            timeout,
        }, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
                const redirectUrl = response.headers.location;
                file.close();

                if (!redirectUrl) {
                    resolve({ success: false, path: outputPath, size: 0, error: "Redirect without location" });
                    return;
                }

                // Handle relative URLs
                const fullUrl = redirectUrl.startsWith("http")
                    ? redirectUrl
                    : new URL(redirectUrl, url).href;

                httpDownload(fullUrl, outputPath, {
                    ...options,
                    redirectCount: redirectCount + 1,
                }).then(resolve);
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                resolve({
                    success: false,
                    path: outputPath,
                    size: 0,
                    error: `HTTP ${response.statusCode}`,
                });
                return;
            }

            const contentLength = parseInt(response.headers["content-length"] || "0", 10);
            const contentType = response.headers["content-type"];

            if (contentLength > maxSize) {
                file.close();
                request.destroy();
                resolve({
                    success: false,
                    path: outputPath,
                    size: 0,
                    error: `File too large (${Math.round(contentLength / 1024 / 1024)}MB > ${Math.round(maxSize / 1024 / 1024)}MB)`,
                });
                return;
            }

            response.on("data", (chunk) => {
                downloaded += chunk.length;

                if (downloaded > maxSize) {
                    aborted = true;
                    request.destroy();
                    file.close();
                    return;
                }

                if (onProgress) {
                    onProgress(downloaded, contentLength || null);
                }
            });

            response.pipe(file);

            file.on("finish", () => {
                file.close();

                if (aborted) {
                    resolve({
                        success: false,
                        path: outputPath,
                        size: downloaded,
                        error: "File size exceeded limit during download",
                    });
                    return;
                }

                resolve({
                    success: true,
                    path: outputPath,
                    size: downloaded,
                    contentType,
                });
            });
        });

        request.on("error", (err) => {
            file.close();
            resolve({
                success: false,
                path: outputPath,
                size: 0,
                error: err.message,
            });
        });

        request.on("timeout", () => {
            request.destroy();
            file.close();
            resolve({
                success: false,
                path: outputPath,
                size: 0,
                error: "Download timed out",
            });
        });
    });
}

/**
 * Download using yt-dlp for complex sources
 */
async function ytdlpDownload(
    url: string,
    outputPath: string,
    timeout: number
): Promise<DownloadResult> {
    return new Promise((resolve) => {
        const args = [
            url,
            "-o", outputPath,
            "-f", "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
            "--no-playlist",
            "--no-check-certificate",
            "--retries", "3",
            "--socket-timeout", "30",
            "--user-agent", USER_AGENTS.twitter,
        ];

        // Add Twitter-specific args
        if (url.includes("twitter.com") || url.includes("x.com")) {
            args.push("--extractor-args", "twitter:api=syndication");
        }

        const proc = spawn("yt-dlp", args);
        let stderr = "";
        let completed = false;

        // Timeout
        const timeoutId = setTimeout(() => {
            if (!completed) {
                proc.kill("SIGTERM");
            }
        }, timeout);

        proc.stderr?.on("data", (data) => {
            stderr += data.toString();
        });

        proc.on("close", async (code) => {
            completed = true;
            clearTimeout(timeoutId);

            if (code === 0) {
                try {
                    const stats = await stat(outputPath);
                    resolve({
                        success: true,
                        path: outputPath,
                        size: stats.size,
                    });
                } catch {
                    resolve({
                        success: false,
                        path: outputPath,
                        size: 0,
                        error: "Download completed but file not found",
                    });
                }
            } else {
                // Parse common errors
                let errorMsg = "Download failed";

                if (stderr.includes("Private video") || stderr.includes("protected")) {
                    errorMsg = "Video is private or protected";
                } else if (stderr.includes("unavailable") || stderr.includes("No video")) {
                    errorMsg = "No video found at this URL";
                } else if (stderr.includes("rate limit") || stderr.includes("429")) {
                    errorMsg = "Rate limit reached. Try again later.";
                } else if (stderr.includes("timed out")) {
                    errorMsg = "Download timed out";
                }

                resolve({
                    success: false,
                    path: outputPath,
                    size: 0,
                    error: errorMsg,
                });
            }
        });

        proc.on("error", (err) => {
            completed = true;
            clearTimeout(timeoutId);
            resolve({
                success: false,
                path: outputPath,
                size: 0,
                error: `yt-dlp error: ${err.message}`,
            });
        });
    });
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Download a file from URL
 * Automatically selects best method based on source
 */
export async function download(options: DownloadOptions): Promise<DownloadResult> {
    const {
        url,
        outputPath,
        timeout = DEFAULT_TIMEOUT,
        maxSize = MAX_FILE_SIZE,
        headers = {},
        onProgress,
    } = options;

    const source = detectSource(url);

    console.log(`[Downloader] Starting download from ${source}: ${url.slice(0, 100)}`);

    // Use yt-dlp for social media video sources
    if (source === "twitter" || source === "youtube" || source === "instagram") {
        // First try yt-dlp
        const result = await ytdlpDownload(url, outputPath, timeout);

        if (result.success) {
            return result;
        }

        // Fall back to direct download if yt-dlp fails and it might be a direct image URL
        if (url.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)(\?|$)/i)) {
            console.log(`[Downloader] yt-dlp failed, trying direct download`);
            return httpDownload(url, outputPath, {
                timeout,
                maxSize,
                headers: {
                    "User-Agent": getUserAgent(source),
                    ...headers,
                },
                onProgress,
            });
        }

        return result;
    }

    // Direct HTTP download for generic URLs
    return httpDownload(url, outputPath, {
        timeout,
        maxSize,
        headers: {
            "User-Agent": getUserAgent(source),
            ...headers,
        },
        onProgress,
    });
}

/**
 * Check if a URL is a direct media file
 */
export function isDirectMediaUrl(url: string): boolean {
    const mediaExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|tiff|mp4|mov|webm|mkv|avi)(\?.*)?$/i;
    return mediaExtensions.test(url);
}

/**
 * Infer file extension from URL or content type
 */
export function inferExtension(url: string, contentType?: string): string {
    // Try URL first
    const urlMatch = url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)(\?|$)/i);
    if (urlMatch) {
        return `.${urlMatch[1].toLowerCase()}`;
    }

    // Try content type
    if (contentType) {
        const typeMap: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/gif": ".gif",
            "image/webp": ".webp",
            "video/mp4": ".mp4",
            "video/quicktime": ".mov",
            "video/webm": ".webm",
        };

        for (const [type, ext] of Object.entries(typeMap)) {
            if (contentType.includes(type)) {
                return ext;
            }
        }
    }

    // Default
    return ".jpg";
}
