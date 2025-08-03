# ===== Stage 1: Install dependencies =====
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm cache clean --force
# Only copy package files to install dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev
COPY . .

# ===== Stage 2: Build the app (optional if no build step) =====


# Stage 2: Run with distroless


FROM gcr.io/distroless/nodejs20

# Set working directory
WORKDIR /app

# Optional: Set environment variable
ENV NODE_ENV=production

# Copy app from builder
COPY --from=builder /app .

# IMPORTANT: Use 'node yourEntry.js', not 'npm start'
CMD [ "src/index.js"]
