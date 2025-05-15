#!/bin/bash
# Script to test webhook security

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing Stripe webhook security...${NC}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed. Please install it first.${NC}"
    exit 1
fi

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

# Test 1: Send a request without a signature
echo -e "\n${GREEN}Test 1: Sending a request without a signature (should fail)...${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_123"}}}' \
  -i

# Test 2: Send a request with an invalid signature
echo -e "\n${GREEN}Test 2: Sending a request with an invalid signature (should fail)...${NC}"
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=invalid_signature" \
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_123"}}}' \
  -i

echo -e "\n${GREEN}Security tests completed.${NC}"
echo -e "${GREEN}Both tests should have failed with a 400 Bad Request response.${NC}"
echo -e "${GREEN}If they did, your webhook security is working correctly.${NC}"
echo -e "${YELLOW}For a complete test, use the Stripe CLI with a valid webhook secret:${NC}"
echo -e "stripe listen --forward-to $WEBHOOK_URL"
echo -e "stripe trigger checkout.session.completed"
