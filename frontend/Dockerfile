# ---------- Build Stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Production Stage with NGINX ----------
FROM nginx:alpine

# Copy custom NGINX config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output to NGINX served directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

