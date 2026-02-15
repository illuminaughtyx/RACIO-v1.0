# RACIO - Optimized Dockerfile for Render (Free Tier)
# Use multi-stage builds to keep image size small

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables must be present at build time for Next.js to bake them in?
# Usually better to provide at runtime, but Next.js static pages need them.
# For now, we assume simple build.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install system dependencies (FFmpeg, Python for yt-dlp)
# We do this in the final stage to keep layers clean
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install yt-dlp

# Copy built application from builder stage
# We only need the standalone output + static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Verify installations
RUN ffmpeg -version && yt-dlp --version
RUN node -v

# Expose port (Render sets PORT env var which Next.js respects automatically)
EXPOSE 3000

# Start directly with node server.js (standalone entry point)
CMD ["node", "server.js"]
