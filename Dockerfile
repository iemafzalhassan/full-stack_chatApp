# ===== Stage 1: Install dependencies =====
FROM node:20-alpine AS deps

WORKDIR /app

# Only copy package files to install dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# ===== Stage 2: Build the app (optional if no build step) =====
# If you don't build or transpile (e.g., Babel/TypeScript), skip this stage

# ===== Stage 3: Final minimal image =====
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy entire source code (since we're not using `dist`)
COPY . .

# Expose port (change if your app uses a different one)
EXPOSE 5001

# Start the app
CMD ["node", "index.js"]

