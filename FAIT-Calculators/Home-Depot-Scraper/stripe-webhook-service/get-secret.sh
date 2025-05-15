#!/bin/bash
# Ultra-simple script to get the webhook secret

echo "Starting Stripe listener..."
echo "Look for a line that says: 'Ready! Your webhook signing secret is whsec_...'"
echo "Copy that secret and add it to your .env file as STRIPE_WEBHOOK_SECRET"
echo ""

# Just run stripe listen directly
stripe listen

# The script will continue running until the user presses Ctrl+C
