#!/bin/bash
# Script to test the Stripe webhook using the Stripe CLI

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Stripe webhook with Stripe CLI...${NC}"

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

# Menu for selecting action
echo -e "${GREEN}Select an action:${NC}"
echo "1. Listen for webhook events"
echo "2. Trigger a test event"
echo "3. Both (listen and trigger)"
read -p "Enter your choice (1-3): " ACTION_CHOICE

# Set webhook URL
WEBHOOK_URL="http://localhost:4242/webhook"

case $ACTION_CHOICE in
    1)
        # Listen for webhook events
        echo -e "${GREEN}Listening for webhook events...${NC}"
        echo -e "${GREEN}Forwarding events to ${WEBHOOK_URL}${NC}"
        echo -e "${GREEN}Press Ctrl+C to stop.${NC}"
        stripe listen --forward-to $WEBHOOK_URL
        ;;
    2)
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
                stripe trigger checkout.session.completed
                ;;
            2)
                echo -e "${GREEN}Triggering payment_intent.succeeded event...${NC}"
                stripe trigger payment_intent.succeeded
                ;;
            3)
                echo -e "${GREEN}Triggering payment_method.attached event...${NC}"
                stripe trigger payment_method.attached
                ;;
            4)
                echo -e "${GREEN}Triggering all events...${NC}"
                echo -e "${GREEN}1. checkout.session.completed${NC}"
                stripe trigger checkout.session.completed
                echo -e "${GREEN}2. payment_intent.succeeded${NC}"
                stripe trigger payment_intent.succeeded
                echo -e "${GREEN}3. payment_method.attached${NC}"
                stripe trigger payment_method.attached
                ;;
            *)
                echo "Invalid choice. Exiting."
                exit 1
                ;;
        esac
        ;;
    3)
        # Open a new terminal for listening
        echo -e "${GREEN}Opening a new terminal to listen for webhook events...${NC}"
        osascript -e "tell application \"Terminal\" to do script \"cd $(pwd) && stripe listen --forward-to $WEBHOOK_URL\""
        
        # Wait for the listener to start
        echo -e "${GREEN}Waiting for the listener to start...${NC}"
        sleep 5
        
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
                stripe trigger checkout.session.completed
                ;;
            2)
                echo -e "${GREEN}Triggering payment_intent.succeeded event...${NC}"
                stripe trigger payment_intent.succeeded
                ;;
            3)
                echo -e "${GREEN}Triggering payment_method.attached event...${NC}"
                stripe trigger payment_method.attached
                ;;
            4)
                echo -e "${GREEN}Triggering all events...${NC}"
                echo -e "${GREEN}1. checkout.session.completed${NC}"
                stripe trigger checkout.session.completed
                echo -e "${GREEN}2. payment_intent.succeeded${NC}"
                stripe trigger payment_intent.succeeded
                echo -e "${GREEN}3. payment_method.attached${NC}"
                stripe trigger payment_method.attached
                ;;
            *)
                echo "Invalid choice. Exiting."
                exit 1
                ;;
        esac
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo -e "${YELLOW}Test completed!${NC}"
