# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Stage 2: Production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 5001

# Switch to non-root user
USER appuser

# Start the server
CMD ["npm", "start"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5001/health || exit 1