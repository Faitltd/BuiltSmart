#!/bin/bash
# Script to deploy the updated Home Depot Scraper to Google Cloud Run

# Exit on error
set -e

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="homedepot-data-extractor"
REGION="us-central1"
API_KEY="52323740B6D14CBE81D81C81E0DD32E6"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deploying updated Home Depot Scraper to Google Cloud Run...${NC}"

# Step 1: Configure gcloud CLI and use current credentials
echo -e "${GREEN}Configuring gcloud CLI...${NC}"
gcloud config set project $PROJECT_ID

# Step 2: Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
docker buildx build --platform linux/amd64 -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Step 3: Push the image to Google Container Registry
echo -e "${GREEN}Pushing image to Google Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Step 4: Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --memory 2Gi \
  --timeout 3600 \
  --allow-unauthenticated \
  --set-env-vars BIGBOX_API_KEY=$API_KEY

# Step 5: Get the deployed URL
echo -e "${GREEN}Deployment complete! Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${YELLOW}Home Depot Scraper is now updated and available at: ${NC}"
echo -e "${GREEN}$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}You can access the jobs page directly at:${NC}"
echo -e "${GREEN}$SERVICE_URL/jobs${NC}"
