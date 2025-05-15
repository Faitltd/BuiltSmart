FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Build TypeScript files
RUN npm run build

# Expose port 4001
EXPOSE 4001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4001

# Start the server
CMD ["npm", "start"]
