# RACIO API Documentation

## Overview

RACIO is an image-first ratio conversion engine that transforms images and videos into multiple aspect ratios for social media platforms.

**Base URL:** `https://your-domain.com` (or `http://localhost:3000` for local development)

---

## API Endpoints

### 1. Convert API

**Endpoint:** `POST /api/convert`

The main conversion endpoint. Accepts an image/video URL or file upload and returns multiple aspect ratio versions.

#### Request (JSON)

```json
{
  "url": "https://example.com/image.jpg",
  "type": "image",
  "formats": ["1:1", "9:16", "16:9"]
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | string | Yes* | - | URL to image or video |
| `type` | string | No | `"image"` | `"image"` or `"video"` |
| `formats` | string[] | No | `["9:16", "1:1", "16:9"]` | Aspect ratios to generate |

*Either `url` or file upload is required

#### Available Formats

| Format | Dimensions | Use Case |
|--------|------------|----------|
| `9:16` | 1080×1920 | TikTok, Reels, Shorts |
| `1:1` | 1080×1080 | Instagram Feed |
| `16:9` | 1920×1080 | YouTube, Twitter |
| `4:5` | 1080×1350 | Instagram Portrait |
| `2:3` | 1080×1620 | Pinterest |
| `21:9` | 2520×1080 | Ultrawide/Cinema |

#### Response (Success)

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "image",
  "processingTimeMs": 2340,
  "results": [
    {
      "format": "1:1",
      "name": "square_1-1",
      "url": "/api/download?id=550e8400-e29b-41d4-a716-446655440000&file=square_1-1.jpg"
    },
    {
      "format": "9:16",
      "name": "vertical_9-16",
      "url": "/api/download?id=550e8400-e29b-41d4-a716-446655440000&file=vertical_9-16.jpg"
    }
  ],
  "zip": "/api/download?id=550e8400-e29b-41d4-a716-446655440000&file=racio-bundle.zip"
}
```

#### Response (Error)

```json
{
  "error": "Failed to download: HTTP 404",
  "requestId": "abc12345"
}
```

#### cURL Examples

**PowerShell:**
```powershell
# Convert image from URL
Invoke-RestMethod -Uri "http://localhost:3000/api/convert" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"url":"https://example.com/image.jpg","type":"image","formats":["1:1","9:16"]}'

# Upload file (PowerShell)
$form = @{
    file = Get-Item -Path "C:\path\to\image.jpg"
    type = "image"
    formats = '["1:1","9:16"]'
}
Invoke-RestMethod -Uri "http://localhost:3000/api/convert" -Method POST -Form $form
```

**Bash/Linux:**
```bash
# Convert image from URL
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/image.jpg","type":"image","formats":["1:1","9:16"]}'

# Upload file
curl -X POST http://localhost:3000/api/convert \
  -F "file=@/path/to/image.jpg" \
  -F "type=image" \
  -F 'formats=["1:1","9:16"]'
```

---

### 2. Download API

**Endpoint:** `GET /api/download`

Download processed files.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Session UUID from convert response |
| `file` | string | Yes | Filename to download |
| `preview` | boolean | No | If `true`, display inline instead of download |

#### Example

```
GET /api/download?id=550e8400-e29b-41d4-a716-446655440000&file=square_1-1.jpg
```

#### Response

- Success: File binary with appropriate `Content-Type`
- Error: JSON with error message

---

### 3. Status API

**Endpoint:** `GET /api/status/{id}`

Check the status of an async job (for long-running video processing).

#### Response (Processing)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "state": "processing",
  "progress": 50,
  "message": "Processing your files..."
}
```

#### Response (Complete)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "state": "complete",
  "progress": 100,
  "message": "Processing complete!",
  "results": [...],
  "zip": "/api/download?id=...&file=racio-bundle.zip"
}
```

---

### 4. Queue Status API

**Endpoint:** `GET /api/queue-status`

Get current server load and queue information.

#### Response

```json
{
  "active": 2,
  "queued": 5,
  "maxConcurrent": 4,
  "estimatedWaitSeconds": 15,
  "serverLoad": "MEDIUM",
  "health": "healthy",
  "canAcceptRequests": true,
  "processing": {
    "active": 1,
    "queued": 3,
    "maxConcurrent": 2,
    "totalProcessed": 150,
    "totalTimeouts": 2,
    "avgWaitTimeMs": 1200
  },
  "downloads": {...},
  "images": {...}
}
```

---

## Rate Limiting

- **Default:** 10 requests per minute per IP
- **Headers:** Check `Retry-After` header on 429 responses

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing/invalid parameters) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## File Retention

- Processed files are **automatically deleted after 1 hour**
- Download your files promptly after processing

---

## Best Practices

1. **For images:** Results are typically ready immediately (< 5 seconds)
2. **For videos:** Use the status endpoint to poll for completion
3. **Check queue status** before heavy operations to avoid timeouts
4. **Download immediately** - files expire after 1 hour
5. **Use specific formats** instead of all formats to reduce processing time

---

## Testing

Run the integration tests:

```bash
npm run test:api
# or
npx tsx src/tests/api.test.ts
```
