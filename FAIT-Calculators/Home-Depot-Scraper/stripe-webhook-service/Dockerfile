FROM node:16-slim

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Run the application
CMD ["node", "index.js"]
