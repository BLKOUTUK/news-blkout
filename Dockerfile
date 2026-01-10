# News BLKOUT - Optimized Dockerfile for Coolify SPA deployment
# Fixes MIME type issues by using nginx with proper configuration

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Use npm install instead of npm ci (no package-lock.json in repo)
RUN npm install

# Copy source
COPY . .

# Build the app
RUN npm run build

# Production stage - Use nginx for proper MIME type handling
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check using curl (wget not available in nginx:alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
