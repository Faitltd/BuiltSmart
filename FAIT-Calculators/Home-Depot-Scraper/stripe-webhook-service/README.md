# Stripe Webhook Service

This service processes Stripe webhook events and adds credits to user accounts when payments are completed.

## Setup Instructions

### 1. Configure Environment Variables

Create a `.env` file with the following variables:

```
# Stripe Configuration
STRIPE_MASTER_API_KEY=sk_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=fait-444705
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Server Configuration
PORT=8080
```

### 2. Set Up Google Cloud Authentication

Run the setup script to create a service account and download credentials:

```bash
./setup-gcloud-auth.sh
```

This will:
- Create a service account with Firestore access
- Download a key file
- Update your .env file with the credentials path

### 3. Configure Stripe Webhook in the Dashboard

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Add a new webhook endpoint with the URL: `https://scraper-webhook-qlkvtyydjq-uc.a.run.app/webhook`
   - Alternatively, you can also use the original endpoint: `https://scraper-webhook-qlkvtyydjq-uc.a.run.app/webhook/stripe`
3. Select the events to listen for:
   - `checkout.session.completed` (required)
   - `payment_intent.succeeded` (optional)
   - `payment_method.attached` (optional)
4. Get the webhook signing secret and update it in your `.env` file:
   - From the Stripe Dashboard: Go to Developers > Webhooks > [Your Endpoint] > Signing Secret
   - From the Stripe CLI: Run `./get-webhook-secret-simple.sh` and copy the displayed secret
     - This script doesn't require a test server to be running
     - Look for a line that says `Ready! Your webhook signing secret is whsec_...`

**IMPORTANT: The webhook secret is critical for security.** It ensures that only Stripe can send valid webhook events to your endpoint. Without proper verification, your webhook could be vulnerable to spoofing attacks.

### 4. Deploy the Service

Run the deployment script:

```bash
./deploy.sh
```

### 5. Test the Integration

Use the test script to verify webhook delivery:

```bash
./test-webhook.sh
```

Then create a test checkout session:

```bash
curl -X POST https://scraper-webhook-qlkvtyydjq-uc.a.run.app/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan_id":"basic", "base_url":"http://localhost:3000"}'
```

Complete the payment using a test card:
- Card number: 4242 4242 4242 4242
- Expiration: Any future date
- CVC: Any 3 digits
- ZIP: Any 5 digits

### 6. Verify Credits Added

Check the Firestore database to verify that credits were added to the user's account.

## API Endpoints

- `GET /` - Root endpoint to check if the service is running
- `GET /health` - Health check endpoint
- `POST /webhook` - New Stripe webhook endpoint (recommended)
- `POST /webhook/stripe` - Original Stripe webhook endpoint (maintained for backward compatibility)
- `POST /create-checkout-session` - Create a Stripe checkout session
- `GET /api/plans` - Get all pricing plans
- `GET /api/user/{user_id}` - Get a user by ID
- `GET /api/user/email/{email}` - Get a user by email
- `GET /api/transactions/{user_id}` - Get a user's transaction history

## Webhook Security

This service implements Stripe's recommended security practices for webhooks:

1. **Signature Verification**: All webhook requests are verified using the Stripe-Signature header and your webhook secret
2. **Raw Body Processing**: The middleware is configured to preserve the raw request body for signature verification
3. **Secure Error Handling**: Detailed errors are logged but generic responses are sent to clients
4. **Environment Variable Security**: Webhook secrets are stored as environment variables, not in code

### Testing Webhook Security

You can test the security of your webhook endpoint using the provided script:

```bash
./test-webhook-security.sh
```

This script will:
1. Send a request without a signature (should be rejected)
2. Send a request with an invalid signature (should be rejected)
3. Provide instructions for testing with valid signatures using the Stripe CLI

### Monitoring Webhook Events

To monitor webhook events and troubleshoot issues:

1. **Stripe Dashboard**: Check the [Webhook Dashboard](https://dashboard.stripe.com/webhooks) for delivery attempts and errors
2. **Service Logs**: Monitor the Cloud Run service logs for detailed error messages
3. **Stripe CLI**: Use `stripe listen` and `stripe trigger` commands to test webhook delivery

### Updating Webhook Secrets

If you need to rotate your webhook secret:

1. Generate a new secret in the Stripe Dashboard or using the Stripe CLI
2. Update your `.env` file with the new secret
3. Deploy the updated service with the new secret
4. Verify that webhook events are still being processed correctly

## Troubleshooting

### Webhook Events Not Being Received

1. Check that your webhook endpoint is publicly accessible
2. Verify that the webhook signing secret is correct
3. Check the Stripe Dashboard for webhook delivery attempts and errors
4. Run the test script to see if events are being forwarded correctly

### Webhook Signature Verification Failed

If you see errors like `⚠️ Webhook signature verification failed`:

1. Make sure you're using the correct webhook secret
   - Run `./get-webhook-secret-simple.sh` to get a new secret for testing
   - If you encounter issues with the script, try running `stripe listen` directly
   - Update your `.env` file with the new secret
2. Ensure you're passing the raw request body to the verification function
   - The middleware is configured to use `express.raw({type: 'application/json'})` for webhook endpoints
3. Check that the `stripe-signature` header is being properly received
4. Verify that the request is coming from Stripe (check IP addresses if needed)

### Firestore Authentication Issues

1. Make sure the service account has the correct permissions
2. Verify that the `GOOGLE_APPLICATION_CREDENTIALS` environment variable is set correctly
3. Check the service logs for authentication errors

### Checkout Session Creation Fails

1. Verify that the plan exists in the database with a valid `stripe_price_id`
2. Check that the Stripe API key is correct
3. Look for error messages in the service logs
