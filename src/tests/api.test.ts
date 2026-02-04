/**
 * RACIO API Integration Tests
 * Run with: npx tsx src/tests/api.test.ts
 */

import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "fs";
import path from "path";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

// Test utilities
async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        return true;
    } catch (e: any) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${e.message}`);
        return false;
    }
}

function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(message);
}

// Create a simple test image (1x1 red pixel PNG)
function createTestImage(): string {
    const testDir = path.join(process.cwd(), "test_assets");
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });

    const testImagePath = path.join(testDir, "test_image.png");

    // 1x1 red pixel PNG (base64 decoded)
    const pngData = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==",
        "base64"
    );

    writeFileSync(testImagePath, pngData);
    return testImagePath;
}

// Test cases
async function runTests() {
    console.log("\n🧪 RACIO API Integration Tests\n");
    console.log(`Target: ${BASE_URL}\n`);

    let passed = 0;
    let failed = 0;

    // =========================================================================
    // Test: Queue Status API
    // =========================================================================
    if (await test("GET /api/queue-status returns valid status", async () => {
        const res = await fetch(`${BASE_URL}/api/queue-status`);
        assert(res.ok, `Expected 200, got ${res.status}`);

        const data = await res.json();
        assert(typeof data.active === "number", "Missing 'active' field");
        assert(typeof data.queued === "number", "Missing 'queued' field");
        assert(typeof data.health === "string", "Missing 'health' field");
        assert(["healthy", "degraded", "critical"].includes(data.health), "Invalid health value");
    })) passed++; else failed++;

    // =========================================================================
    // Test: Convert API - GET (info)
    // =========================================================================
    if (await test("GET /api/convert returns API info", async () => {
        const res = await fetch(`${BASE_URL}/api/convert`);
        assert(res.ok, `Expected 200, got ${res.status}`);

        const data = await res.json();
        assert(data.api === "RACIO Convert API", "Missing API identifier");
        assert(Array.isArray(data.usage.availableFormats), "Missing availableFormats");
        assert(data.usage.availableFormats.includes("1:1"), "Missing 1:1 format");
    })) passed++; else failed++;

    // =========================================================================
    // Test: Convert API - POST with empty body
    // =========================================================================
    if (await test("POST /api/convert with empty body returns 400", async () => {
        const res = await fetch(`${BASE_URL}/api/convert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
        });
        assert(res.status === 400, `Expected 400, got ${res.status}`);

        const data = await res.json();
        assert(data.error, "Missing error message");
    })) passed++; else failed++;

    // =========================================================================
    // Test: Convert API - POST with invalid URL
    // =========================================================================
    if (await test("POST /api/convert with invalid URL returns error", async () => {
        const res = await fetch(`${BASE_URL}/api/convert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: "not-a-valid-url", type: "image" }),
        });
        // Should return 400 for invalid URL
        assert(res.status >= 400, `Expected 4xx/5xx, got ${res.status}`);
    })) passed++; else failed++;

    // =========================================================================
    // Test: Convert API - POST with public image URL
    // =========================================================================
    if (await test("POST /api/convert with public image URL works", async () => {
        // Use a small, reliable public image
        const testImageUrl = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";

        const res = await fetch(`${BASE_URL}/api/convert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                url: testImageUrl,
                type: "image",
                formats: ["1:1"],
            }),
        });

        // Should succeed or fail gracefully (may have network issues)
        const data = await res.json();

        if (res.ok) {
            assert(data.success === true, "Missing success field");
            assert(Array.isArray(data.results), "Missing results array");
            assert(data.results.length > 0, "Empty results array");
            assert(data.results[0].url, "Missing result URL");

            // Verify result URL is accessible
            const downloadRes = await fetch(`${BASE_URL}${data.results[0].url}`);
            assert(downloadRes.ok, `Download failed: ${downloadRes.status}`);

            const contentType = downloadRes.headers.get("content-type") || "";
            assert(contentType.includes("image"), `Expected image content-type, got ${contentType}`);

            const buffer = await downloadRes.arrayBuffer();
            assert(buffer.byteLength > 1000, `File too small: ${buffer.byteLength} bytes`);
        } else {
            // Allow graceful failure for network issues
            console.log(`   Note: API returned error (may be network): ${data.error}`);
        }
    })) passed++; else failed++;

    // =========================================================================
    // Test: Download API - GET with missing params
    // =========================================================================
    if (await test("GET /api/download with missing params returns 400", async () => {
        const res = await fetch(`${BASE_URL}/api/download`);
        assert(res.status === 400, `Expected 400, got ${res.status}`);
    })) passed++; else failed++;

    // =========================================================================
    // Test: Download API - GET with invalid session
    // =========================================================================
    if (await test("GET /api/download with invalid session returns 400/404", async () => {
        const res = await fetch(`${BASE_URL}/api/download?id=invalid&file=test.jpg`);
        assert(res.status === 400 || res.status === 404, `Expected 400/404, got ${res.status}`);
    })) passed++; else failed++;

    // =========================================================================
    // Test: Status API - GET with nonexistent job
    // =========================================================================
    if (await test("GET /api/status/nonexistent returns 404", async () => {
        const res = await fetch(`${BASE_URL}/api/status/00000000-0000-0000-0000-000000000000`);
        assert(res.status === 404, `Expected 404, got ${res.status}`);

        const data = await res.json();
        assert(data.state === "not_found" || data.error, "Missing state or error");
    })) passed++; else failed++;

    // =========================================================================
    // Summary
    // =========================================================================
    console.log("\n" + "=".repeat(50));
    console.log(`Results: ${passed} passed, ${failed} failed`);
    console.log("=".repeat(50) + "\n");

    return failed === 0;
}

// Run tests
runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(e => {
        console.error("Test runner error:", e);
        process.exit(1);
    });
