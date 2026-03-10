FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite
ARG VITE_API_URL
ARG VITE_AUTH_URL
ARG VITE_PRODUCT_URL
ARG VITE_APPOINTMENT_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_AUTH_URL=$VITE_AUTH_URL \
    VITE_PRODUCT_URL=$VITE_PRODUCT_URL \
    VITE_APPOINTMENT_URL=$VITE_APPOINTMENT_URL

# Build the app
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]