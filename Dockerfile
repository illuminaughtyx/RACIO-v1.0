# RACIO - Image-First Ratio Engine
# Production Dockerfile with FFmpeg and yt-dlp

FROM node:20-slim

# Install system dependencies
# ffmpeg: required for image/video processing
# python3: required for yt-dlp
# ca-certificates: updates certs for https downloads
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp via python virtual environment
# We create a venv to avoid externally managed environment errors
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install yt-dlp

# Verify installations
RUN ffmpeg -version && yt-dlp --version

# Application Setup
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install dependencies (clean install for production)
RUN npm ci

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
