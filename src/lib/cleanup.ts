import { readdir, stat, rm } from "fs/promises";
import path from "path";
import os from "os";

const RACIO_TEMP_DIR = path.join(os.tmpdir(), "racio");
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

async function cleanupOldSessions() {
    try {
        const entries = await readdir(RACIO_TEMP_DIR, { withFileTypes: true });
        const now = Date.now();

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const sessionPath = path.join(RACIO_TEMP_DIR, entry.name);
                try {
                    const stats = await stat(sessionPath);
                    const age = now - stats.mtimeMs;

                    if (age > MAX_AGE_MS) {
                        await rm(sessionPath, { recursive: true, force: true });
                        console.log(`[Cleanup] Deleted expired session: ${entry.name}`);
                    }
                } catch (e) {
                    // Session might have been deleted already
                }
            }
        }
    } catch (e) {
        // Directory might not exist yet
        if ((e as any).code !== "ENOENT") {
            console.error("[Cleanup] Error:", e);
        }
    }
}

// Run cleanup every 15 minutes
export function startCleanupScheduler() {
    console.log("[Cleanup] Starting auto-cleanup scheduler (every 15 min, max age: 1 hour)");

    // Run immediately on start
    cleanupOldSessions();

    // Then run every 15 minutes
    setInterval(cleanupOldSessions, 15 * 60 * 1000);
}

export { cleanupOldSessions };
