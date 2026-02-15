# RACIO Infrastructure Documentation

## Overview

RACIO is an image-first ratio conversion engine built with Next.js. This document covers deployment, scaling, and operational considerations.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         RACIO Architecture                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Frontend   │    │   API Layer  │    │   Workers    │       │
│  │   (React)    │───▶│   (Next.js)  │───▶│  (FFmpeg)    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                             │                    │               │
│                             ▼                    ▼               │
│                      ┌──────────────┐    ┌──────────────┐       │
│                      │    Queue     │    │  Temp Store  │       │
│                      │  (In-Memory) │    │   (/tmp)     │       │
│                      └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Options

### Option 1: Railway (Recommended)

1. Connect GitHub repository
2. Set environment variables:
   ```
   NODE_ENV=production
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_URL=https://your-app.railway.app
   ```
3. Deploy with `railway up`

**Railway Config (`railway.json`):**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### Option 2: Docker + VPS

```bash
# Build image
docker build -t racio:latest .

# Run container
docker run -d \
  --name racio \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e FFMPEG_CONCURRENCY=2 \
  -v /tmp/racio:/tmp/racio \
  --memory=2g \
  --cpus=2 \
  racio:latest
```

### Option 3: Vercel + External Processing

For Vercel deployment, you'll need an external processing service since Vercel functions have time/size limits.

### Option 4: Render (Free Docker Tier)

1. Create a [Render.com](https://render.com) account
2. Click **New +** -> **Web Service**
3. Connect your GitHub repository
4. Wait for Render to detect the `Dockerfile`
5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_URL`: `https://your-service-name.onrender.com`
6. Click **Create Web Service**

**Note:** The free tier spins down after 15 minutes of inactivity. For continuous uptime, upgrade to the Starter plan ($7/mo).

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | `production` or `development` |
| `PORT` | No | `3000` | Server port |
| `STRIPE_SECRET_KEY` | For payments | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For payments | - | Stripe webhook signing secret |
| `NEXT_PUBLIC_URL` | Yes | - | Public URL for the app |
| `FFMPEG_CONCURRENCY` | No | `2` | Max concurrent FFmpeg processes |
| `QUEUE_PROCESSING_CONCURRENCY` | No | `2` | Max concurrent processing jobs |
| `QUEUE_DOWNLOAD_CONCURRENCY` | No | `2` | Max concurrent downloads |
| `QUEUE_PROCESSING_TIMEOUT` | No | `180000` | Processing timeout (ms) |
| `QUEUE_DOWNLOAD_TIMEOUT` | No | `60000` | Download timeout (ms) |

---

## Resource Requirements

### Minimum (Image processing only)
- **CPU**: 1 vCPU
- **RAM**: 1GB
- **Storage**: 5GB (temp files auto-cleanup)

### Recommended (Image + Video)
- **CPU**: 2 vCPU
- **RAM**: 2GB
- **Storage**: 10GB

### High Volume
- **CPU**: 4 vCPU
- **RAM**: 4GB
- **Storage**: 20GB
- Consider multiple replicas

---

## Scaling Considerations

### Horizontal Scaling

1. **Session Affinity**: Not required (stateless processing)
2. **Shared Storage**: For multi-replica deployments, use S3 or shared volume
3. **Queue Backend**: Upgrade to Redis + BullMQ for distributed processing

### Queue Configuration for Scale

```typescript
// For production with Redis
const config = {
  processingMaxConcurrent: 4,  // Per instance
  processingMaxQueueSize: 100,
  downloadMaxConcurrent: 3,
  downloadMaxQueueSize: 50,
};
```

---

## Monitoring

### Health Check Endpoint

```
GET /api/queue-status
```

Response:
```json
{
  "health": "healthy|degraded|critical",
  "active": 2,
  "queued": 5,
  "canAcceptRequests": true
}
```

### Key Metrics to Monitor

1. **Queue depth** - Alert if consistently > 20
2. **Processing time** - Alert if > 60s for images
3. **Error rate** - Alert if > 5%
4. **Timeout rate** - Alert if > 2%

### Log Analysis

Search for these log patterns:
```
📊 RACIO_ANALYTICS:  - Success metrics
[Queue] Timeout:     - Queue timeouts
[FFmpegPool] failed: - Processing failures
[Download] Error:    - Download failures
```

---

## Security

### Rate Limiting

Built-in rate limiting: 10 requests/minute per IP

To adjust:
```typescript
const RATE_LIMIT = { 
  maxRequests: 20,    // Increase for production
  windowMs: 60000 
};
```

### File Validation

- Path traversal prevention on all file operations
- UUID session ID validation
- File size limits enforced

### Cleanup

Automatic cleanup runs every 15 minutes:
- Files older than 1 hour are deleted
- Temp directories are purged

---

## Troubleshooting

### Common Issues

**Empty ZIP downloads:**
- Check FFmpeg is installed: `docker exec racio ffmpeg -version`
- Verify temp directory permissions: `docker exec racio ls -la /tmp/racio`
- Check file validation in download route

**Processing timeouts:**
- Reduce `FFMPEG_CONCURRENCY` if CPU-bound
- Increase timeout for video processing
- Check for memory pressure

**Queue full errors:**
- Scale horizontally
- Increase `QUEUE_PROCESSING_MAX_SIZE`
- Add Redis for distributed queue

### Debug Mode

```bash
# Run with debug logging
docker run -d \
  --name racio-debug \
  -e DEBUG=racio:* \
  -e NODE_ENV=development \
  racio:latest
```

---

## Backup & Recovery

### What to backup
- `.licenses.json` (if using file-based licenses)
- Environment variables / secrets

### What NOT to backup
- `/tmp/racio/` (temporary processing files)
- `node_modules/`
- `.next/`

---

## Cost Estimation

| Provider | Plan | Monthly Cost | Capacity |
|----------|------|--------------|----------|
| Railway | Starter | ~$5-20 | ~1000 conversions/day |
| Railway | Pro | ~$20-50 | ~5000 conversions/day |
| DigitalOcean | Basic 2GB | $12 | ~2000 conversions/day |
| AWS ECS | t3.small | ~$15 | ~2000 conversions/day |

---

## Upgrade Path

### Phase 1: Current (MVP)
- In-memory queue
- Local temp storage
- Single instance

### Phase 2: Scale
- Redis queue (BullMQ)
- S3 storage with signed URLs
- Multiple instances

### Phase 3: Enterprise
- Kubernetes deployment
- Auto-scaling based on queue depth
- CDN for downloads
- Dedicated FFmpeg workers
