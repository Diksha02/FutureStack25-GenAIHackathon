# Use Node.js 20 LTS version (required for better-sqlite3)
FROM node:20-alpine

# Install build dependencies for better-sqlite3 and wget for healthcheck
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    wget

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY server/package*.json ./server/

# Install dependencies
WORKDIR /app/server
RUN npm ci --omit=dev && npm cache clean --force

# Copy application files
WORKDIR /app
COPY server/ ./server/
COPY pages/ ./pages/
COPY README.md ./

# Create directory for SQLite database with proper permissions
RUN mkdir -p /app/server/src/db && chmod 755 /app/server/src/db

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5050

# Set working directory to server
WORKDIR /app/server

# Start the application
CMD ["npm", "start"]

