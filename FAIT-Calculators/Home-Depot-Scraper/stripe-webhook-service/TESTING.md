# Testing Stripe Webhooks

This guide will walk you through testing your Stripe webhook implementation locally and in production, with a focus on security.

## Prerequisites

- Node.js and npm installed
- Stripe CLI installed (https://stripe.com/docs/stripe-cli)
- Stripe account with API keys

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   - Create a `.env` file with your Stripe API keys
   - Example:
     ```
     STRIPE_MASTER_API_KEY=sk_test_your_test_key
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
     GOOGLE_CLOUD_PROJECT=fait-444705
     ```

3. Get the webhook signing secret:
   ```bash
   npm run get:webhook-secret
   ```
   This will start the Stripe CLI listener and display your webhook signing secret.
   Copy this secret and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

3. Log in to Stripe CLI:
   ```bash
   stripe login
   ```

## Testing Options

### Option 1: Run the Test Server and Use Stripe CLI

1. Start the test server:
   ```bash
   npm run test:server
   ```
   This will start a server on port 4242 with a webhook endpoint at `/webhook`.

2. In a new terminal, use the Stripe CLI to forward events:
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```

3. In another terminal, trigger test events:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Option 2: Use the Testing Script

We've created a script that simplifies the testing process:

```bash
npm run test:webhook
```

This script will:
1. Check if Stripe CLI is installed and logged in
2. Provide options to listen for events, trigger events, or both
3. Allow you to select specific event types to test

## Available Test Events

You can test the following Stripe events:

- `checkout.session.completed` - Triggered when a checkout session is completed
- `payment_intent.succeeded` - Triggered when a payment is successful
- `payment_method.attached` - Triggered when a payment method is attached to a customer

## Verifying Webhook Functionality

When testing, you should see:

1. The webhook server receiving the event
2. The event type being logged
3. The appropriate handler function being called
4. A 200 response being sent back to Stripe

Example log output:
```
Received webhook at /webhook endpoint
Processing event type: payment_intent.succeeded
PaymentIntent for 1000 was successful!
```

## Security Testing

### Testing Webhook Security

We've created a script to test the security of your webhook implementation:

```bash
./test-webhook-security.sh
```

This script performs two important security tests:

1. **No Signature Test**: Sends a request without a Stripe signature header
   - This should be rejected with a 400 error
   - Verifies that your webhook rejects unsigned requests

2. **Invalid Signature Test**: Sends a request with an invalid signature
   - This should be rejected with a 400 error
   - Verifies that your webhook properly validates signatures

Both tests should fail with a 400 Bad Request response, indicating that your webhook is properly rejecting unauthorized requests.

### Testing in Production

To test your production webhook security:

1. Deploy your webhook service with a valid webhook secret
2. Run the security test script against your production endpoint
3. Check the logs for proper error messages
4. Verify in the Stripe Dashboard that invalid requests are being rejected

### Security Best Practices

Your webhook implementation should follow these security best practices:

1. **Always verify signatures**: Never skip signature verification in production
2. **Use environment variables**: Store the webhook secret in environment variables, not in code
3. **Preserve raw body**: Ensure middleware doesn't modify the request body before verification
4. **Log securely**: Log detailed errors for debugging but return generic responses to clients
5. **Rotate secrets**: Periodically rotate your webhook secrets for enhanced security

## Troubleshooting

### Webhook Secret Issues

If you see signature verification errors like `⚠️ Webhook signature verification failed`, you may need to:
1. Get the webhook signing secret from the Stripe CLI output:
   ```bash
   ./get-webhook-secret-simple.sh
   ```
   If you encounter issues with the script, try running the Stripe CLI directly:
   ```bash
   stripe listen
   ```
2. Look for a line like this in the output:
   ```
   Ready! Your webhook signing secret is whsec_abc123... (^C to quit)
   ```
3. Copy the webhook signing secret (starts with `whsec_`)
4. Update your `.env` file with the correct secret:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_copied_secret
   ```
5. Restart your test server

### Connection Issues

If the Stripe CLI can't connect to your webhook:
1. Make sure your server is running on port 4242
2. Check that the webhook endpoint is `/webhook`
3. Verify there are no firewalls blocking the connection

### Event Handling Issues

If events are received but not processed correctly:
1. Check the event structure in the logs
2. Verify that your switch statement is handling the event type
3. Make sure your handler functions are working as expected

### Security Verification Failures

If your security tests are failing:
1. Check that your middleware is correctly configured to preserve the raw body
2. Verify that signature verification is properly implemented
3. Ensure the webhook secret is correctly set in your environment
4. Check for any middleware that might be interfering with the request body
