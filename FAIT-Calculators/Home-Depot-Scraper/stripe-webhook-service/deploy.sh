#!/bin/bash
# Deployment script for Stripe webhook service

# Exit on error
set -e

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="scraper-webhook"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of Stripe webhook service to Google Cloud Run...${NC}"

# Check if environment variables are set
if [ -z "$STRIPE_MASTER_API_KEY" ]; then
  echo -e "${RED}Error: STRIPE_MASTER_API_KEY environment variable is not set.${NC}"
  echo -e "Please set it by running: export STRIPE_MASTER_API_KEY=your_stripe_api_key"
  exit 1
fi

# Check if webhook secret is set
if [ -z "$STRIPE_WEBHOOK_SECRET" ] || [ "$STRIPE_WEBHOOK_SECRET" == "whsec_your_webhook_secret" ]; then
  echo -e "${YELLOW}Warning: STRIPE_WEBHOOK_SECRET environment variable is not set or is using the default value.${NC}"
  echo -e "${YELLOW}This is insecure and should not be used in production.${NC}"
  echo -e "${YELLOW}To get a webhook secret, run: ./get-webhook-secret.sh${NC}"
  echo -e "${YELLOW}Then set it by running: export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret${NC}"

  # Ask for confirmation
  read -p "Do you want to continue without a proper webhook secret? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment aborted.${NC}"
    exit 1
  fi
fi

# Step 1: Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci

# Step 2: Build the container image
echo -e "${GREEN}Building container image...${NC}"
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME

# Step 3: Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars STRIPE_MASTER_API_KEY=$STRIPE_MASTER_API_KEY,STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET,GOOGLE_CLOUD_PROJECT=$PROJECT_ID

# Step 4: Get the service URL
echo -e "${GREEN}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "Service URL: ${SERVICE_URL}"
echo -e "Webhook endpoints: ${SERVICE_URL}/webhook and ${SERVICE_URL}/webhook/stripe"
echo -e "${YELLOW}Important: Update your Stripe webhook endpoint in the Stripe Dashboard to point to one of these URLs${NC}"
echo -e "${YELLOW}Make sure to add the webhook secret in the Stripe Dashboard as well${NC}"
