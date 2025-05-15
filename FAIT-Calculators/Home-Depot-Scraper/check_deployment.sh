#!/bin/bash
# Script to check the deployment status of the Home Depot Scraper in Google Cloud Run

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="homedepot-scraper"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking deployment status of Home Depot Scraper in Google Cloud Run...${NC}"

# Configure gcloud CLI and authenticate with web-based login
echo -e "${GREEN}Configuring gcloud CLI and launching web authentication...${NC}"
gcloud auth login --no-launch-browser
gcloud config set project $PROJECT_ID

# Check if the service exists
echo -e "${GREEN}Checking if service exists...${NC}"
if gcloud run services describe $SERVICE_NAME --platform managed --region $REGION &> /dev/null; then
    echo -e "${GREEN}Service $SERVICE_NAME exists.${NC}"

    # Get service details
    echo -e "${GREEN}Getting service details...${NC}"
    gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'yaml(status)'

    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

    echo -e "${YELLOW}Home Depot Scraper is deployed and available at: ${NC}"
    echo -e "${GREEN}$SERVICE_URL${NC}"

    # Check if the service is responding
    echo -e "${GREEN}Checking if service is responding...${NC}"
    if curl -s "$SERVICE_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}Service is healthy and responding.${NC}"
    else
        echo -e "${YELLOW}Service may not be responding correctly. Check the logs.${NC}"
    fi

    # Show how to view logs
    echo -e "${YELLOW}To view logs, run:${NC}"
    echo -e "gcloud logging read \"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME\" --limit 10"
else
    echo -e "${YELLOW}Service $SERVICE_NAME does not exist or you don't have permission to access it.${NC}"
    echo -e "${YELLOW}To deploy the service, run:${NC}"
    echo -e "./deploy_to_cloud.sh"
fi
