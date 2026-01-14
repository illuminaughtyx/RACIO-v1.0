---
description: Deploy RACIO to Railway - Production deployment workflow
---

# Deploy RACIO to Railway

## Prerequisites
- Railway account connected to your GitHub repo
- Railway CLI installed (`npm install -g @railway/cli`)
- Environment variables configured in Railway dashboard

## Environment Variables Required
Set these in Railway dashboard (Settings → Variables):

```
LEMON_SQUEEZY_API_KEY=your_api_key
LEMON_SQUEEZY_WEBHOOK_SECRET=your_webhook_secret
LEMON_SQUEEZY_STORE_ID=your_store_id
NODE_ENV=production
```

---

## Quick Deploy (Recommended)

// turbo-all

### 1. Check for uncommitted changes
```bash
git status
```

### 2. Commit all changes
```bash
git add -A && git commit -m "chore: deploy latest changes"
```

### 3. Push to trigger Railway auto-deploy
```bash
git push origin main
```

### 4. Monitor deployment in Railway dashboard
Visit: https://railway.app/dashboard

---

## Manual Deploy via Railway CLI

### 1. Login to Railway
```bash
railway login
```

### 2. Link to project (first time only)
```bash
railway link
```

### 3. Deploy
```bash
railway up
```

---

## Verify Deployment

### 1. Check app is running
```bash
curl https://your-app.railway.app/api/queue-status
```

Expected response:
```json
{"active":0,"queued":0,"maxConcurrent":2,"estimatedWaitSeconds":0,"serverLoad":"LOW"}
```

### 2. Test video processing
- Go to https://your-app.railway.app
- Upload a small test video
- Verify all 3 formats are generated

### 3. Check logs for errors
```bash
railway logs
```

---

## Rollback (if needed)

### Via Railway Dashboard
1. Go to Deployments tab
2. Find last working deployment
3. Click "Redeploy"

### Via Git
```bash
git revert HEAD
git push origin main
```

---

## Scaling Tips

| Situation | Solution |
|-----------|----------|
| High traffic | Increase replicas in railway.json |
| Memory issues | Upgrade Railway plan |
| CPU maxed | Consider Cloudinary for processing |

---

## Monitoring

### Check queue status
```bash
curl https://your-app.railway.app/api/queue-status
```

### Watch logs in real-time
```bash
railway logs --follow
```

### Analytics (check Railway logs)
Search for `RACIO_ANALYTICS:` in logs for usage data.
