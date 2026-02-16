# RACIO - Production Dockerfile
# Optimized for Render (Free Tier) using Static FFmpeg

# --- Stage 1: Dependencies ---
FROM node:20-slim AS deps
# yt-dlp-exec needs python during npm install (postinstall script)
RUN apt-get update && apt-get install -y python3 && ln -s /usr/bin/python3 /usr/bin/python && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# --- Stage 2: Builder ---
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Stage 3: Runner ---
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Install minimal runtime dependencies (Python, FFmpeg, fonts)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    xz-utils \
    ffmpeg \
    fontconfig \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp in venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install yt-dlp

# Copy App
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

# Verify
RUN ffmpeg -version && yt-dlp --version && node -v

EXPOSE 3000
CMD ["node", "server.js"]
