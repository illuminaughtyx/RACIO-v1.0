# RACIO - Image-First Ratio Engine
# Production Dockerfile with FFmpeg and yt-dlp

FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/bin/python

# Verify installations
RUN ffmpeg -version && ffprobe -version && yt-dlp --version

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY . .

# Build the Next.js app
RUN npm run build

# Create temp directory for processing
RUN mkdir -p /tmp/racio && chmod 777 /tmp/racio

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV FFMPEG_CONCURRENCY=2
ENV QUEUE_PROCESSING_CONCURRENCY=2
ENV QUEUE_DOWNLOAD_CONCURRENCY=2

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/queue-status || exit 1

# Start the app
CMD ["npm", "start"]

