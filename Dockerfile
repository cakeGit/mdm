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
# Copy the entire app directory from builder
COPY --from=builder /app ./

# Copy root package.json and node_modules for npm start

# Expose port
EXPOSE 3005

ENV PORT=3005
ENV NODE_ENV=production
ENV DB_PATH=/app/data/database.sqlite

CMD ["npm", "start"]