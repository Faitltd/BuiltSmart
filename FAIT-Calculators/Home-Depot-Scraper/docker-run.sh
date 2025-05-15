#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cat > .env << EOL
FLASK_ENV=development
BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6
LOWES_API_KEY=D302834B9CC3400FA921A2F2D384ADD6
PORT=8080
EOL
  echo ".env file created with your API keys"
fi

# Build the Docker image
echo "Building Docker image..."
docker build -f Dockerfile.minimal -t homedepot-scraper-minimal .

# Run the Docker container
echo "Running Docker container..."
docker run -p 8080:8080 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  homedepot-scraper-minimal
