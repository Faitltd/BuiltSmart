#!/bin/bash
# Deployment script for Retail Scrapers (Home Depot & Lowe's) to Google Cloud Run

# Exit on error
set -e

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="retail-scrapers"
REGION="us-central1"
HD_API_KEY="52323740B6D14CBE81D81C81E0DD32E6"
LOWES_API_KEY="D302834B9CC3400FA921A2F2D384ADD6"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of Retail Scrapers to Google Cloud Run...${NC}"

# Step 1: Configure gcloud CLI and use current credentials
echo -e "${GREEN}Configuring gcloud CLI...${NC}"
gcloud config set project $PROJECT_ID

# Step 2: Build the Docker image
echo -e "${GREEN}Building Docker image for multiple platforms...${NC}"
# Create a new builder instance if it doesn't exist
docker buildx create --name multiplatform-builder --use || true

# Build and push the image for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t gcr.io/$PROJECT_ID/$SERVICE_NAME --push .

# Step 3: Image is already pushed by buildx
echo -e "${GREEN}Image built and pushed to Google Container Registry...${NC}"

# Step 4: Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory 2Gi \
  --timeout 3600 \
  --allow-unauthenticated \
  --set-env-vars BIGBOX_API_KEY=$HD_API_KEY,LOWES_API_KEY=$LOWES_API_KEY

# Step 5: Get the deployed URL
echo -e "${GREEN}Deployment complete! Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${YELLOW}Retail Scrapers (Home Depot & Lowe's) are now deployed and available at: ${NC}"
echo -e "${GREEN}$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}You can access Home Depot Scraper at:${NC}"
echo -e "${GREEN}${SERVICE_URL}${NC}"
echo -e "${YELLOW}You can access Lowe's Scraper at:${NC}"
echo -e "${GREEN}${SERVICE_URL}/lowes${NC}"
echo ""
echo -e "${YELLOW}You can also access it with the following command:${NC}"
echo -e "gcloud run services browse $SERVICE_NAME --platform managed --region $REGION"
