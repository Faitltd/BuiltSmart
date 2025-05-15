#!/bin/bash
# Script to check the deployment status of the Home Depot Scraper

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="homedepot-data-extractor"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking deployment status of Home Depot Scraper...${NC}"

# Step 1: Configure gcloud CLI and authenticate with web-based login
echo -e "${GREEN}Configuring gcloud CLI and launching web authentication...${NC}"
gcloud auth login --no-launch-browser
gcloud config set project $PROJECT_ID

# Step 2: Get the deployed URL
echo -e "${GREEN}Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')

echo -e "${YELLOW}Home Depot Scraper is available at: ${NC}"
echo -e "${GREEN}$SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}Jobs page is available at:${NC}"
echo -e "${GREEN}$SERVICE_URL/jobs${NC}"

# Step 3: Open the jobs page in the browser
echo -e "${GREEN}Opening the jobs page in your browser...${NC}"
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$SERVICE_URL/jobs"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$SERVICE_URL/jobs"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$SERVICE_URL/jobs"
else
    echo -e "${YELLOW}Could not automatically open the URL. Please visit:${NC}"
    echo -e "${GREEN}$SERVICE_URL/jobs${NC}"
fi
