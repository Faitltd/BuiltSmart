#!/bin/bash
# Script to set up Google Cloud authentication for the Stripe webhook service

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up Google Cloud authentication for Stripe webhook service...${NC}"

# Step 1: Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Step 2: Check if logged in to gcloud
echo -e "${GREEN}Checking Google Cloud authentication...${NC}"
gcloud auth list --filter=status:ACTIVE --format="value(account)" || {
    echo "You are not logged in to gcloud. Please run 'gcloud auth login' first."
    exit 1
}

# Step 3: Set the project
PROJECT_ID="fait-444705"
echo -e "${GREEN}Setting Google Cloud project to ${PROJECT_ID}...${NC}"
gcloud config set project $PROJECT_ID

# Step 4: Create a service account if it doesn't exist
SERVICE_ACCOUNT_NAME="stripe-webhook-service"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo -e "${GREEN}Checking if service account ${SERVICE_ACCOUNT_EMAIL} exists...${NC}"
if ! gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL &> /dev/null; then
    echo -e "${GREEN}Creating service account ${SERVICE_ACCOUNT_EMAIL}...${NC}"
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
        --display-name="Stripe Webhook Service Account"
fi

# Step 5: Grant Firestore permissions
echo -e "${GREEN}Granting Firestore permissions to service account...${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
    --role="roles/datastore.user"

# Step 6: Create and download a key file
KEY_FILE="service-account-key.json"
echo -e "${GREEN}Creating and downloading service account key to ${KEY_FILE}...${NC}"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SERVICE_ACCOUNT_EMAIL

# Step 7: Set environment variable
echo -e "${GREEN}Setting GOOGLE_APPLICATION_CREDENTIALS environment variable...${NC}"
echo "export GOOGLE_APPLICATION_CREDENTIALS=\"$(pwd)/${KEY_FILE}\"" >> .env

echo -e "${YELLOW}Google Cloud authentication setup complete!${NC}"
echo -e "The service account key has been saved to ${KEY_FILE}"
echo -e "The GOOGLE_APPLICATION_CREDENTIALS environment variable has been added to .env"
echo -e "You can now deploy the service with proper Firestore authentication."
