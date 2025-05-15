#!/bin/bash
# Script to get the webhook secret from the Stripe CLI

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Getting webhook secret from Stripe CLI...${NC}"

# Check if stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI is not installed. Please install it first."
    echo "Visit: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Check if stripe is logged in
echo -e "${GREEN}Checking Stripe authentication...${NC}"
# Try to get account info to check if logged in
if ! stripe whoami &> /dev/null; then
    echo "You are not logged in to Stripe CLI. Please run 'stripe login' first."
    exit 1
fi
echo -e "${GREEN}Authentication successful!${NC}"

# Check if test server is running
echo -e "${GREEN}Checking if test server is running on port 4242...${NC}"
# Try different methods to check if port 4242 is open
if ! (nc -z localhost 4242 &>/dev/null || curl -s localhost:4242 &>/dev/null || timeout 1 bash -c "</dev/tcp/localhost/4242" &>/dev/null); then
    echo -e "${YELLOW}Warning: No server detected on port 4242.${NC}"
    echo -e "${YELLOW}You should start the test server first with:${NC}"
    echo -e "${YELLOW}npm run test:server${NC}"
    echo -e "${YELLOW}or${NC}"
    echo -e "${YELLOW}node test-server.js${NC}"

    # Ask if they want to continue anyway
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting. Please start the test server and try again."
        exit 1
    fi
fi

# Start listening for webhook events
echo -e "${GREEN}Starting Stripe CLI listener...${NC}"
echo -e "${GREEN}This will output your webhook signing secret.${NC}"
echo -e "${GREEN}IMPORTANT: Look for a line that says 'Ready! Your webhook signing secret is whsec_...'${NC}"
echo -e "${GREEN}Copy the webhook signing secret (starts with whsec_) and add it to your .env file:${NC}"
echo -e "${YELLOW}STRIPE_WEBHOOK_SECRET=whsec_your_secret_here${NC}"
echo -e "${GREEN}Press Ctrl+C to stop the listener when you're done.${NC}"
echo ""

# Run the stripe listen command
stripe listen --forward-to localhost:4242/webhook

# Note: The script will continue running until the user presses Ctrl+C
