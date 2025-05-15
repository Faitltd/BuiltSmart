#!/bin/bash
# Script to test different Stripe webhook events

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Stripe webhook events...${NC}"

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
echo -e "${GREEN}Enter the webhook endpoint URL (e.g., https://scraper-webhook-qlkvtyydjq-uc.a.run.app/webhook):${NC}"
read WEBHOOK_URL

# Confirm the URL
echo -e "${GREEN}You entered: ${WEBHOOK_URL}${NC}"
echo -e "${GREEN}Is this correct? (y/n)${NC}"
read CONFIRM

if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    echo "Aborting."
    exit 1
fi

# Menu for selecting event type
echo -e "${GREEN}Select an event type to trigger:${NC}"
echo "1. checkout.session.completed"
echo "2. payment_intent.succeeded"
echo "3. payment_method.attached"
echo "4. All of the above"
read -p "Enter your choice (1-4): " EVENT_CHOICE

# Trigger the selected event(s)
case $EVENT_CHOICE in
    1)
        echo -e "${GREEN}Triggering checkout.session.completed event...${NC}"
        stripe trigger checkout.session.completed --webhook-endpoint=$WEBHOOK_URL
        ;;
    2)
        echo -e "${GREEN}Triggering payment_intent.succeeded event...${NC}"
        stripe trigger payment_intent.succeeded --webhook-endpoint=$WEBHOOK_URL
        ;;
    3)
        echo -e "${GREEN}Triggering payment_method.attached event...${NC}"
        stripe trigger payment_method.attached --webhook-endpoint=$WEBHOOK_URL
        ;;
    4)
        echo -e "${GREEN}Triggering all events...${NC}"
        echo -e "${GREEN}1. checkout.session.completed${NC}"
        stripe trigger checkout.session.completed --webhook-endpoint=$WEBHOOK_URL
        echo -e "${GREEN}2. payment_intent.succeeded${NC}"
        stripe trigger payment_intent.succeeded --webhook-endpoint=$WEBHOOK_URL
        echo -e "${GREEN}3. payment_method.attached${NC}"
        stripe trigger payment_method.attached --webhook-endpoint=$WEBHOOK_URL
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo -e "${YELLOW}Test completed!${NC}"
