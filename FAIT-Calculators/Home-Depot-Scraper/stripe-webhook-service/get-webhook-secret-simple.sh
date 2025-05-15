#!/bin/bash
# Simple script to get the webhook secret from the Stripe CLI

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Getting webhook secret from Stripe CLI (simple version)...${NC}"

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}Error: Stripe CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if stripe is logged in
echo -e "${GREEN}Checking Stripe authentication...${NC}"

# Print Stripe CLI version for debugging
echo -e "${GREEN}Stripe CLI version:${NC}"
stripe --version

# Print Stripe config for debugging
echo -e "${GREEN}Stripe config:${NC}"
stripe config

# Try to get account info to check if logged in
echo -e "${GREEN}Trying to get account info...${NC}"
stripe whoami

# Skip authentication check and proceed anyway
echo -e "${YELLOW}Proceeding with webhook secret generation...${NC}"

# Start listening for webhook events
echo -e "${GREEN}Starting Stripe CLI listener...${NC}"
echo -e "${GREEN}This will output your webhook signing secret.${NC}"
echo -e "${GREEN}IMPORTANT: Look for a line that says 'Ready! Your webhook signing secret is whsec_...'${NC}"
echo -e "${GREEN}Copy the webhook signing secret (starts with whsec_) and add it to your .env file:${NC}"
echo -e "${YELLOW}STRIPE_WEBHOOK_SECRET=whsec_your_secret_here${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the listener when you're done.${NC}"
echo ""

# Run the stripe listen command without forwarding to any server
stripe listen

# Note: The script will continue running until the user presses Ctrl+C
