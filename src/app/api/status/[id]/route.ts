import { NextRequest, NextResponse } from "next/server";
import { stat, readdir } from "fs/promises";
import path from "path";
import os from "os";

// ============================================================================
// JOB STATUS API - Check status of async jobs
// ============================================================================
// GET /api/status/:id
// Returns job status and result URLs when complete
// ============================================================================

// Job states
type JobState = "pending" | "processing" | "complete" | "failed";

interface JobStatus {
    id: string;
    state: JobState;
    type?: "image" | "video";
    progress?: number;
    message?: string;
    results?: { format: string; name: string; url: string }[];
    zip?: string;
    error?: string;
    createdAt?: string;
    completedAt?: string;
}

// Simple in-memory job store (replace with Redis in production)
// This is shared with the convert API
const jobStore = new Map<string, JobStatus>();

// Export for use by convert API
export { jobStore };

// Check if session directory exists and has output files
async function checkSessionStatus(sessionId: string): Promise<JobStatus | null> {
    const tempDir = path.join(os.tmpdir(), "racio", sessionId);

    try {
        const stats = await stat(tempDir);
        if (!stats.isDirectory()) {
            return null;
        }

        // List files in the directory
        const files = await readdir(tempDir);

        // Check for output files (not input)
        const outputFiles = files.filter(f =>
            !f.startsWith("input") &&
            (f.endsWith(".jpg") || f.endsWith(".png") || f.endsWith(".mp4") || f.endsWith(".zip"))
        );

        if (outputFiles.length === 0) {
            // Still processing
            return {
                id: sessionId,
                state: "processing",
                progress: 50,
                message: "Processing your files...",
            };
        }

        // Has output files - complete
        const results = outputFiles
            .filter(f => !f.endsWith(".zip"))
            .map(f => {
                const name = path.basename(f, path.extname(f));
                const format = name.includes("9-16") ? "9:16" :
                    name.includes("1-1") ? "1:1" :
                        name.includes("16-9") ? "16:9" :
                            name.includes("4-5") ? "4:5" :
                                name.includes("2-3") ? "2:3" :
                                    name.includes("21-9") ? "21:9" : name;

                return {
                    format,
                    name,
                    url: `/api/download?id=${sessionId}&file=${f}`,
                };
            });

        const hasZip = outputFiles.some(f => f.endsWith(".zip"));

        return {
            id: sessionId,
            state: "complete",
            progress: 100,
            message: "Processing complete!",
            results,
            zip: hasZip ? `/api/download?id=${sessionId}&file=racio-bundle.zip` : undefined,
        };

    } catch (e: any) {
        if (e.code === "ENOENT") {
            return null; // Session doesn't exist
        }
        throw e;
    }
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { error: "Job ID is required" },
                { status: 400 }
            );
        }

        // Validate ID format (UUID)
        if (!/^[0-9a-f-]{36}$/i.test(id)) {
            return NextResponse.json(
                { error: "Invalid job ID format" },
                { status: 400 }
            );
        }

        // First check in-memory store
        const storedJob = jobStore.get(id);
        if (storedJob) {
            return NextResponse.json(storedJob);
        }

        // Fall back to checking file system
        const fsStatus = await checkSessionStatus(id);

        if (fsStatus) {
            return NextResponse.json(fsStatus);
        }

        // Job not found
        return NextResponse.json(
            {
                error: "Job not found or expired",
                id,
                state: "not_found" as const,
            },
            { status: 404 }
        );

    } catch (error: any) {
        console.error("[Status] Error:", error);
        return NextResponse.json(
            { error: "Failed to check job status" },
            { status: 500 }
        );
    }
}
