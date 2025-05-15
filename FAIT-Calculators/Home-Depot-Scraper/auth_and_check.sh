#!/bin/bash
# Script to authenticate with Google Cloud and check deployment status

# Configuration
PROJECT_ID="fait-444705"
SERVICE_NAME="homedepot-scraper"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Authenticating with Google Cloud and checking deployment status...${NC}"

# Step 1: Authenticate with web-based login
echo -e "${GREEN}Launching web authentication...${NC}"
gcloud auth login --no-launch-browser

# Step 2: Configure project
echo -e "${GREEN}Setting project to $PROJECT_ID...${NC}"
gcloud config set project $PROJECT_ID

# Step 3: Check if the service exists
echo -e "${GREEN}Checking if service exists...${NC}"
if gcloud run services describe $SERVICE_NAME --platform managed --region $REGION &> /dev/null; then
    echo -e "${GREEN}Service $SERVICE_NAME exists.${NC}"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
    
    echo -e "${YELLOW}Home Depot Scraper is deployed and available at: ${NC}"
    echo -e "${GREEN}$SERVICE_URL${NC}"
    
    # Open the URL in the browser
    echo -e "${GREEN}Opening the service URL in your browser...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$SERVICE_URL"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$SERVICE_URL"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows
        start "$SERVICE_URL"
    else
        echo -e "${YELLOW}Could not automatically open the URL. Please visit:${NC}"
        echo -e "${GREEN}$SERVICE_URL${NC}"
    fi
else
    echo -e "${YELLOW}Service $SERVICE_NAME does not exist or you don't have permission to access it.${NC}"
    echo -e "${YELLOW}To deploy the service, run:${NC}"
    echo -e "./deploy_to_cloud.sh"
fi
