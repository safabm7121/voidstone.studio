FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) for building
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies
RUN npm cache clean --force
RUN npm ci --only=production
# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3002

# Run in production mode
CMD ["npm", "start"]