# Stripe-Integrated Scraper Service

This project integrates Stripe payments with the Home Depot and Lowe's scraper service, allowing users to purchase credits and use them to access the scraping functionality.

## Components

1. **Firestore Database**: Stores user data, credits, transactions, and pricing plans
2. **Stripe Webhook Service**: Processes Stripe webhook events and adds credits to user accounts
3. **API Service**: Provides endpoints for scraping with credit management
4. **User Service**: Manages users, API keys, and credits
5. **Checkout Pages**: Simple web interface for purchasing credits
6. **User Dashboard**: Interface for users to view credits and API key
7. **Admin Dashboard**: Interface for administrators to manage users and credits

## Setup Instructions

### 1. Set Up Firestore Database

1. Install the Google Cloud SDK and authenticate:
   ```bash
   gcloud auth login
   gcloud config set project fait-444705
   ```

2. Install the required Python packages:
   ```bash
   pip install -r requirements_stripe_integration.txt
   ```

3. Initialize the Firestore database:
   ```bash
   python setup_firestore.py --test-data
   ```

### 2. Configure Stripe

1. Create a Stripe account if you don't have one: https://dashboard.stripe.com/register

2. Get your API keys from the Stripe Dashboard:
   - Stripe Secret Key (for server-side)
   - Stripe Publishable Key (for client-side)

3. Create Stripe products and prices and update the Firestore database:
   ```bash
   export STRIPE_MASTER_API_KEY=sk_test_your_secret_key
   python setup_stripe_products.py
   ```

4. Set up Stripe webhook:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login to Stripe
   stripe login

   # Forward webhook events to your local server
   stripe listen --forward-to http://localhost:8080/webhook/stripe
   ```

5. Get the webhook signing secret from the Stripe CLI output and set it as an environment variable:
   ```bash
   export STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### 3. Set Environment Variables

Create a `.env` file with the following variables:

```
# API Keys
BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6
LOWES_API_KEY=D302834B9CC3400FA921A2F2D384ADD6

# Stripe Configuration
STRIPE_MASTER_API_KEY=sk_test_your_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=fait-444705

# Admin Configuration
ADMIN_API_KEY=your_admin_api_key
```

### 4. Run the Services Locally

1. Run the Stripe webhook service:
   ```bash
   cd stripe-webhook-service
   pip install -r requirements.txt
   python main.py
   ```

2. Run the API service:
   ```bash
   pip install -r api_service_requirements.txt
   python api_service.py
   ```

3. Run the user service:
   ```bash
   pip install -r user_service_requirements.txt
   python user_service.py
   ```

4. Run the checkout server:
   ```bash
   cd checkout
   pip install -r requirements.txt
   python server.py
   ```

5. Serve the dashboards:
   ```bash
   # Install a simple HTTP server
   pip install http-server

   # Serve the admin dashboard
   cd admin
   http-server -p 8084

   # Serve the user dashboard
   cd dashboard
   http-server -p 8085
   ```

## Usage

### Admin Dashboard

1. Open the admin dashboard in your browser: http://localhost:8084
2. Use the admin API key to access the dashboard
3. Create users, add credits, and view transaction history

### User Dashboard

1. Open the user dashboard in your browser: http://localhost:8085
2. Log in with your email and API key
3. View your credit balance, API key, and transaction history

### Purchasing Credits

1. Open the checkout page in your browser: http://localhost:8082
2. Select a pricing plan and click "Buy Now"
3. Complete the payment using the Stripe checkout form
4. Credits will be automatically added to your account

### Using the API

1. Get your API key from the user dashboard
2. Make requests to the API endpoints with your API key in the `X-API-Key` header:

```bash
# Example: Scrape a product
curl -X POST http://localhost:8081/api/scrape/product \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{"url": "https://www.homedepot.com/p/123456", "source": "homedepot"}'
```

## Deployment

### Deploy to Google Cloud Run

1. Deploy the Stripe webhook service:
   ```bash
   cd stripe-webhook-service
   chmod +x deploy.sh
   ./deploy.sh
   ```

   Or use Cloud Build:
   ```bash
   cd stripe-webhook-service
   gcloud builds submit --config=cloudbuild.yaml \
     --substitutions=_STRIPE_MASTER_API_KEY="sk_test_your_secret_key",_STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"
   ```

2. Deploy the API service:
   ```bash
   # Create a Dockerfile for the API service
   cat > Dockerfile.api << 'EOF'
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt api_service_requirements.txt ./
   COPY db /app/db
   COPY api_service.py /app/
   RUN pip install --no-cache-dir -r api_service_requirements.txt
   ENV PORT=8080
   ENV PYTHONUNBUFFERED=1
   CMD ["python", "api_service.py"]
   EOF

   # Build and deploy
   gcloud builds submit --tag gcr.io/fait-444705/scraper-api -f Dockerfile.api
   gcloud run deploy scraper-api \
     --image gcr.io/fait-444705/scraper-api \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6,LOWES_API_KEY=D302834B9CC3400FA921A2F2D384ADD6,GOOGLE_CLOUD_PROJECT=fait-444705
   ```

3. Deploy the user service:
   ```bash
   # Create a Dockerfile for the user service
   cat > Dockerfile.user << 'EOF'
   FROM python:3.9-slim
   WORKDIR /app
   COPY requirements.txt user_service_requirements.txt ./
   COPY db /app/db
   COPY user_service.py /app/
   RUN pip install --no-cache-dir -r user_service_requirements.txt
   ENV PORT=8080
   ENV PYTHONUNBUFFERED=1
   CMD ["python", "user_service.py"]
   EOF

   # Build and deploy
   gcloud builds submit --tag gcr.io/fait-444705/user-service -f Dockerfile.user
   gcloud run deploy user-service \
     --image gcr.io/fait-444705/user-service \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars ADMIN_API_KEY=your_admin_api_key,GOOGLE_CLOUD_PROJECT=fait-444705
   ```

4. Deploy the checkout server:
   ```bash
   # Create a Dockerfile for the checkout server
   cat > Dockerfile.checkout << 'EOF'
   FROM python:3.9-slim
   WORKDIR /app
   COPY checkout/requirements.txt ./
   COPY db /app/db
   COPY checkout /app/checkout
   RUN pip install --no-cache-dir -r requirements.txt
   ENV PORT=8080
   ENV PYTHONUNBUFFERED=1
   WORKDIR /app/checkout
   CMD ["python", "server.py"]
   EOF

   # Build and deploy
   gcloud builds submit --tag gcr.io/fait-444705/scraper-checkout -f Dockerfile.checkout
   gcloud run deploy scraper-checkout \
     --image gcr.io/fait-444705/scraper-checkout \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars STRIPE_MASTER_API_KEY=sk_test_your_secret_key,STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key,GOOGLE_CLOUD_PROJECT=fait-444705
   ```

5. Deploy the dashboards:
   ```bash
   # Create a Dockerfile for the dashboards
   cat > Dockerfile.dashboards << 'EOF'
   FROM nginx:alpine
   COPY admin /usr/share/nginx/html/admin
   COPY dashboard /usr/share/nginx/html/dashboard
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   EOF

   # Build and deploy
   gcloud builds submit --tag gcr.io/fait-444705/scraper-dashboards -f Dockerfile.dashboards
   gcloud run deploy scraper-dashboards \
     --image gcr.io/fait-444705/scraper-dashboards \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

### Update Service URLs

After deployment, update the API URLs in the following files:

1. `checkout/index.html`: Update the `API_URL` variable
2. `admin/index.html`: Update the `API_URL` variable
3. `dashboard/index.html`: Update the `API_URL` variable

### Update Stripe Webhook Endpoint

After deployment, update your Stripe webhook endpoint in the Stripe Dashboard to point to your deployed webhook service:

```
https://scraper-webhook-[hash].us-central1.run.app/webhook/stripe
```

## Testing

### Test the Webhook Service

1. Use the Stripe CLI to send test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

2. Check the logs to verify that the webhook is processing events correctly:
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scraper-webhook" --limit 10
   ```

### Test the API Service

1. Create a test user and add credits using the admin dashboard

2. Make test requests to the API endpoints with the test user's API key:
   ```bash
   # Example: Get user credits
   curl -X GET https://scraper-api-[hash].us-central1.run.app/api/user/credits \
     -H "X-API-Key: YOUR_API_KEY"

   # Example: Scrape a product
   curl -X POST https://scraper-api-[hash].us-central1.run.app/api/scrape/product \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{"url": "https://www.homedepot.com/p/123456", "source": "homedepot"}'
   ```

### Test the Complete Flow

1. Create a test user using the admin dashboard
2. Purchase credits using the checkout page
3. Verify that credits are added to the user's account
4. Use the API to scrape products and verify that credits are deducted

## Monitoring and Maintenance

1. Monitor API usage and credit consumption:
   ```bash
   # View transaction logs in Firestore
   gcloud firestore collections list transactions
   ```

2. Monitor Stripe webhook deliveries:
   ```bash
   # Check the Stripe Dashboard for webhook delivery status
   # https://dashboard.stripe.com/webhooks
   ```

3. Monitor Cloud Run services:
   ```bash
   # View Cloud Run service logs
   gcloud logging read "resource.type=cloud_run_revision" --limit 10
   ```

4. Update pricing plans as needed:
   ```bash
   # Update plans in both Stripe and Firestore
   python setup_stripe_products.py
   ```

## Security Considerations

1. **API Key Protection**: API keys are sensitive credentials. Ensure they are transmitted securely and stored safely.

2. **Stripe Webhook Verification**: Always verify Stripe webhook signatures to prevent fraudulent requests.

3. **Rate Limiting**: Implement rate limiting to prevent abuse of your API.

4. **Firestore Security Rules**: Configure Firestore security rules to restrict access to your data.

5. **Environment Variables**: Keep sensitive information in environment variables, not in code.

## Future Enhancements

1. **Subscription Model**: Implement recurring subscriptions instead of one-time purchases.

2. **Advanced User Management**: Add user roles, permissions, and teams.

3. **Usage Analytics**: Implement detailed analytics for API usage and credit consumption.

4. **Bulk Operations**: Add support for bulk scraping operations.

5. **Webhooks**: Allow users to configure webhooks for asynchronous scraping results.
