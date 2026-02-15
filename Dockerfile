# RACIO - Optimized Dockerfile for Render (Free Tier)
# Use Alpine Linux for minimal footprint (~10x smaller than Debian)

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
# libc6-compat needed for some Next.js dependencies on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Stage 2: Builder ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install system dependencies (FFmpeg, Python for yt-dlp)
# Alpine's ffmpeg is lightweight and dependency-free
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    py3-pip \
    curl \
    ca-certificates

# Install yt-dlp in a virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install yt-dlp

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Verify installations
RUN ffmpeg -version && yt-dlp --version

# Expose port 3000
EXPOSE 3000

# Start application
CMD ["node", "server.js"]
