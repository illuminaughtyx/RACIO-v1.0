import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import os from "os";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const filename = searchParams.get("file");

    if (!id || !filename) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Validate ID to prevent directory traversal
    // (Assuming UUIDv4)
    if (!/^[0-9a-f-]{36}$/.test(id)) {
        return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    // Validate filename (basic check)
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(os.tmpdir(), "racio", id, filename);

    try {
        const fileBuffer = await readFile(filePath);
        const response = new NextResponse(fileBuffer);

        response.headers.set("Content-Type", "application/octet-stream");
        response.headers.set("Content-Disposition", `attachment; filename="${filename}"`);

        return response;
    } catch (e) {
        return NextResponse.json({ error: "File not found or expired" }, { status: 404 });
    }
}
