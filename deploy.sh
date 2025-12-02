#!/bin/bash
# ============================================
# BUILDSMART PRODUCTION DEPLOYMENT SCRIPT
# ============================================

set -e

echo "🚀 Starting BuildSmart deployment..."

# Configuration
PROJECT_DIR="/var/www/BuiltSmart"
DOCKER_IMAGE="buildsmart:latest"
CONTAINER_NAME="buildsmart"
PORT="8080"

# Pull latest code
echo "📥 Pulling latest code from GitHub..."
cd $PROJECT_DIR
git pull origin main

# Build Docker image
echo "🔨 Building Docker image..."
docker build -f Dockerfile.production -t $DOCKER_IMAGE .

# Stop existing container
echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME || true
docker rm $CONTAINER_NAME || true

# Run new container
echo "▶️  Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:80 \
  $DOCKER_IMAGE

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Health check
echo "🏥 Performing health check..."
sleep 5
if curl -f http://localhost:$PORT > /dev/null 2>&1; then
    echo "✅ Deployment successful!"
    echo "🌐 BuildSmart is now running on port $PORT"
else
    echo "❌ Health check failed!"
    exit 1
fi

echo "✨ Deployment complete!"
