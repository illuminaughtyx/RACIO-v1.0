/**
 * Streaming Archiver Module
 * Creates ZIP archives with streaming and file validation
 */

import archiver from "archiver";
import { createWriteStream, createReadStream, existsSync } from "fs";
import { stat, readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { Writable, PassThrough } from "stream";

// ============================================================================
// CONFIGURATION
// ============================================================================

// Minimum file size to include in archive
const MIN_FILE_SIZE = 100; // bytes

// Compression level (0 = store only, 9 = max compression)
// Using 1 for fast compression
const COMPRESSION_LEVEL = 1;

// ============================================================================
// TYPES
// ============================================================================

export interface ArchiveFile {
    /** Absolute path to the file */
    path: string;
    /** Name to use in the archive (without leading slash) */
    name: string;
}

export interface ArchiveResult {
    success: boolean;
    path?: string;
    size?: number;
    fileCount?: number;
    error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate that a file exists and is not empty
 */
async function validateFile(filePath: string): Promise<{ valid: boolean; size: number }> {
    try {
        const stats = await stat(filePath);
        return {
            valid: stats.isFile() && stats.size >= MIN_FILE_SIZE,
            size: stats.size,
        };
    } catch {
        return { valid: false, size: 0 };
    }
}

// ============================================================================
// ARCHIVE FUNCTIONS
// ============================================================================

/**
 * Create a ZIP archive from files and save to disk
 */
export async function createArchive(
    files: ArchiveFile[],
    outputPath: string
): Promise<ArchiveResult> {
    // Validate all files first
    const validFiles: ArchiveFile[] = [];

    for (const file of files) {
        const { valid, size } = await validateFile(file.path);
        if (valid) {
            validFiles.push(file);
        } else {
            console.warn(`[Archiver] Skipping invalid file: ${file.path} (size: ${size})`);
        }
    }

    if (validFiles.length === 0) {
        return {
            success: false,
            error: "No valid files to archive",
        };
    }

    return new Promise((resolve) => {
        const output = createWriteStream(outputPath);
        const archive = archiver("zip", {
            zlib: { level: COMPRESSION_LEVEL },
        });

        let totalSize = 0;

        output.on("close", () => {
            resolve({
                success: true,
                path: outputPath,
                size: archive.pointer(),
                fileCount: validFiles.length,
            });
        });

        archive.on("error", (err) => {
            resolve({
                success: false,
                error: err.message,
            });
        });

        archive.on("warning", (err) => {
            if (err.code !== "ENOENT") {
                console.warn("[Archiver] Warning:", err.message);
            }
        });

        archive.pipe(output);

        // Add files to archive
        for (const file of validFiles) {
            const ext = path.extname(file.path);
            const archiveName = file.name.endsWith(ext) ? file.name : `${file.name}${ext}`;

            archive.file(file.path, { name: archiveName });
        }

        archive.finalize();
    });
}

/**
 * Create a ZIP archive and stream directly to HTTP response
 * Used for direct download without saving to disk
 */
export function createStreamingArchive(
    files: ArchiveFile[],
    archiveName: string = "download.zip"
): {
    stream: PassThrough;
    headers: Record<string, string>;
    startArchiving: () => Promise<void>;
} {
    const passthrough = new PassThrough();

    const headers: Record<string, string> = {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${archiveName}"`,
        "Cache-Control": "no-store, max-age=0",
    };

    const startArchiving = async () => {
        try {
            // Validate files first
            const validFiles: ArchiveFile[] = [];

            for (const file of files) {
                const { valid } = await validateFile(file.path);
                if (valid) {
                    validFiles.push(file);
                }
            }

            if (validFiles.length === 0) {
                passthrough.destroy(new Error("No valid files to archive"));
                return;
            }

            const archive = archiver("zip", {
                zlib: { level: COMPRESSION_LEVEL },
            });

            archive.on("error", (err) => {
                passthrough.destroy(err);
            });

            archive.pipe(passthrough);

            // Add files
            for (const file of validFiles) {
                const ext = path.extname(file.path);
                const archiveName = file.name.endsWith(ext) ? file.name : `${file.name}${ext}`;
                archive.file(file.path, { name: archiveName });
            }

            await archive.finalize();

        } catch (err: any) {
            passthrough.destroy(err);
        }
    };

    return {
        stream: passthrough,
        headers,
        startArchiving,
    };
}

/**
 * Get all valid media files from a session directory
 */
export async function getSessionFiles(sessionDir: string): Promise<ArchiveFile[]> {
    const files: ArchiveFile[] = [];

    try {
        const entries = await readdir(sessionDir);

        for (const entry of entries) {
            // Skip input files and existing zips
            if (entry.startsWith("input") || entry.endsWith(".zip")) {
                continue;
            }

            // Only include media files
            const ext = path.extname(entry).toLowerCase();
            if (![".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm"].includes(ext)) {
                continue;
            }

            const filePath = path.join(sessionDir, entry);
            const { valid } = await validateFile(filePath);

            if (valid) {
                files.push({
                    path: filePath,
                    name: path.basename(entry, ext),
                });
            }
        }
    } catch (e) {
        console.error("[Archiver] Error reading session directory:", e);
    }

    return files;
}

/**
 * Create archive with summary
 */
export async function createArchiveWithSummary(
    sessionDir: string,
    outputName: string = "racio-bundle.zip"
): Promise<ArchiveResult> {
    const outputPath = path.join(sessionDir, outputName);

    // Get all valid files
    const files = await getSessionFiles(sessionDir);

    if (files.length === 0) {
        return {
            success: false,
            error: "No valid files found in session",
        };
    }

    console.log(`[Archiver] Creating archive with ${files.length} files`);

    return createArchive(files, outputPath);
}
