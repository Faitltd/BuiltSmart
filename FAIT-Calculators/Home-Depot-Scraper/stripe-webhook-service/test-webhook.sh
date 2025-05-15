#!/bin/bash
# Script to test the Stripe webhook integration

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Stripe webhook integration...${NC}"

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI is not installed. Please install it first."
    echo "Visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if stripe is logged in
echo -e "${GREEN}Checking Stripe authentication...${NC}"
stripe config | grep -q "api_key" || {
    echo "You are not logged in to Stripe CLI. Please run 'stripe login' first."
    exit 1
}

# Get the webhook endpoint URL
echo -e "${GREEN}Enter the webhook endpoint URL (e.g., https://scraper-webhook-qlkvtyydjq-uc.a.run.app/webhook/stripe):${NC}"
read WEBHOOK_URL

# Confirm the URL
echo -e "${GREEN}You entered: ${WEBHOOK_URL}${NC}"
echo -e "${GREEN}Is this correct? (y/n)${NC}"
read CONFIRM

if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo "Aborting."
    exit 1
fi

# Forward events to the webhook endpoint
echo -e "${GREEN}Forwarding Stripe events to ${WEBHOOK_URL}...${NC}"
echo -e "${GREEN}Press Ctrl+C to stop.${NC}"

stripe listen --forward-to $WEBHOOK_URL

# Note: The above command will keep running until manually stopped
# After stopping, you can trigger test events with:
# stripe trigger checkout.session.completed
