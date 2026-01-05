# RACIO - The Ratio Engine

> **Paste once → get all ratios → post everywhere.**

RACIO is a video ratio engine that intelligently processes videos and outputs three platform-optimized formats:
- **9:16** (Reels / Shorts)
- **1:1** (Instagram Feed)
- **16:9** (YouTube / Landscape)

## Features

✅ **Smart Processing** - Automatically detects input aspect ratio and applies optimal strategy  
✅ **No Watermarks** - Clean output files, no branding added  
✅ **No Login Required** - Use instantly without creating an account  
✅ **Auto-Cleanup** - Files are automatically deleted after 1 hour  
✅ **X/Twitter URL Support** - Paste video URLs directly  
✅ **ZIP Downloads** - Get all formats in one convenient bundle  
✅ **Progress Feedback** - Real-time processing stages  

## Tech Stack

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Custom CSS with glassmorphism effects
- **Video Processing**: FFmpeg (fluent-ffmpeg)
- **URL Downloads**: yt-dlp
- **Icons**: Lucide React

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## Deployment to Railway

### Prerequisites
- Railway account
- GitHub repository with the code

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect the Dockerfile and build

3. **Environment Variables** (Optional)
   - `NODE_ENV=production` (auto-set by Railway)
   - `PORT=3000` (auto-set by Railway)

4. **Custom Domain**
   - Go to Settings → Domains
   - Add your custom domain or use the Railway-generated one

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process` | POST | Upload a video file for processing |
| `/api/fetch-url` | POST | Download video from X/Twitter URL |
| `/api/download` | GET | Download processed files |

## Smart Processing Logic

| Input | 9:16 Strategy | 1:1 Strategy | 16:9 Strategy |
|-------|---------------|--------------|---------------|
| Vertical (9:16) | Fit with padding | Center crop | Blur sides |
| Landscape (16:9) | Center crop | Center crop | Fit with padding |

## File Structure

```
racio/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── process/route.ts    # Video processing
│   │   │   ├── fetch-url/route.ts  # URL downloads
│   │   │   └── download/route.ts   # File serving
│   │   ├── page.tsx                # Main page
│   │   ├── layout.tsx              # Root layout
│   │   └── globals.css             # Styles
│   ├── components/
│   │   ├── UploadBox.tsx           # Upload UI
│   │   ├── Processing.tsx          # Progress UI
│   │   └── Results.tsx             # Download UI
│   └── lib/
│       └── cleanup.ts              # Auto-cleanup
├── Dockerfile                       # Production build
├── railway.json                     # Railway config
└── package.json
```

## License

MIT
