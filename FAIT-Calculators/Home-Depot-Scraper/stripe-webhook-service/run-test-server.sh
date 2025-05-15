#!/bin/bash
# Script to run the test server for Stripe webhook testing

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Stripe webhook test server...${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    exit 1
fi

# Run the test server
echo -e "${GREEN}Running test server on port 4242...${NC}"
node test-server.js
