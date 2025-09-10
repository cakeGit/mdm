# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy built application
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/schema.sql ./backend/schema.sql
COPY --from=builder /app/frontend/dist ./frontend/dist

# Create data directory for SQLite database
# (created later and owned by the non-root user to avoid permission issues)

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/database.sqlite

# Expose port
EXPOSE 3001

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mdm -u 1001

# Change ownership of app directory and ensure data dir is owned and writable
RUN chown -R mdm:nodejs /app \
  && mkdir -p /app/data \
  && chown -R mdm:nodejs /app/data \
  && chmod 700 /app/data

USER mdm

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "backend/dist/index.js"]