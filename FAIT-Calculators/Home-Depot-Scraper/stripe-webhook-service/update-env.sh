#!/bin/bash
# Script to update the .env file with a webhook secret

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Update .env file with webhook secret${NC}"

# Ask for the webhook secret
echo -e "${GREEN}Enter your webhook secret (starts with whsec_):${NC}"
read SECRET

# Validate the secret format
if [[ ! $SECRET =~ ^whsec_ ]]; then
    echo -e "${RED}Error: Invalid webhook secret format. It should start with 'whsec_'${NC}"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    exit 1
fi

# Update the .env file
if grep -q "STRIPE_WEBHOOK_SECRET=" .env; then
    # Replace existing line
    sed -i '' "s|STRIPE_WEBHOOK_SECRET=.*|STRIPE_WEBHOOK_SECRET=$SECRET|" .env
else
    # Add new line
    echo "STRIPE_WEBHOOK_SECRET=$SECRET" >> .env
fi

echo -e "${GREEN}Successfully updated .env file with webhook secret${NC}"
echo -e "${GREEN}You can now deploy your webhook service with:${NC}"
echo -e "${YELLOW}./deploy.sh${NC}"
