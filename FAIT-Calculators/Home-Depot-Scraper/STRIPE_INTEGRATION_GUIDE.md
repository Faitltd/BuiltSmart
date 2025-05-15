# Stripe Integration Guide

This guide will walk you through the steps to complete the Stripe integration with your scraper service.

## Prerequisites

- A Stripe account (create one at https://dashboard.stripe.com/register if you don't have one)
- Node.js and npm installed
- Google Cloud SDK installed and configured
- Firestore database set up

## Step 1: Set Up Environment Variables

Create a `.env` file in the `stripe-webhook-service` directory with the following variables:

```
# Stripe Configuration
STRIPE_MASTER_API_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=fait-444705

# Server Configuration
PORT=8080
```

Replace `sk_test_your_secret_key` with your actual Stripe secret key from the Stripe Dashboard.

## Step 2: Install Dependencies

```bash
cd stripe-webhook-service
npm install
```

## Step 3: Set Up Stripe Products and Prices

```bash
cd stripe-webhook-service
npm run setup:stripe
```

This will create the following products and prices in Stripe:

- Basic Plan: $9.99 for 100 credits
- Standard Plan: $19.99 for 250 credits
- Premium Plan: $49.99 for 1000 credits

It will also update the Firestore database with the Stripe price IDs.

## Step 4: Configure Stripe Webhook

1. Start the webhook service locally:

```bash
cd stripe-webhook-service
npm run dev
```

2. In a new terminal, use the Stripe CLI to forward webhook events:

```bash
stripe listen --forward-to http://localhost:8080/webhook/stripe
```

3. Copy the webhook signing secret from the Stripe CLI output and add it to your `.env` file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

4. For production, go to the Stripe Dashboard:
   - Navigate to Developers > Webhooks
   - Click "Add endpoint"
   - Enter your webhook URL (e.g., https://scraper-webhook-[hash].us-central1.run.app/webhook/stripe)
   - Select the events to listen for:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
   - Click "Add endpoint"
   - Copy the signing secret and update your production environment variables

## Step 5: Test the Integration

1. Start the webhook service:

```bash
cd stripe-webhook-service
npm run dev
```

2. Create a test checkout session:

```bash
curl -X POST http://localhost:8080/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"plan_id":"basic", "base_url":"http://localhost:3000"}'
```

3. Open the checkout URL in your browser and complete the payment using a test card:
   - Card number: 4242 4242 4242 4242
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. Verify that the webhook received the event:
   - Check the webhook service logs
   - Verify that credits were added to the user's account in Firestore

## Step 6: Integrate with Your Frontend

1. Copy the React components to your frontend:
   - `CreditsPurchase.jsx`: Component for purchasing credits
   - `CheckoutSuccess.jsx`: Success page after payment
   - `CheckoutCancel.jsx`: Cancel page if payment is cancelled
   - `UserCredits.jsx`: Component for displaying user credits and transactions

2. Update the API URLs in the components to point to your actual API endpoints.

3. Add the components to your routes:

```jsx
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import CreditsPurchase from './CreditsPurchase';
import CheckoutSuccess from './CheckoutSuccess';
import CheckoutCancel from './CheckoutCancel';
import UserCredits from './UserCredits';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/credits/purchase" component={CreditsPurchase} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/dashboard/credits" render={() => <UserCredits apiKey={userApiKey} />} />
        {/* Other routes */}
      </Switch>
    </Router>
  );
}
```

4. Add a link to the credits purchase page in your navigation:

```jsx
<Link to="/credits/purchase" className="nav-link">Buy Credits</Link>
```

## Step 7: Deploy to Production

1. Deploy the webhook service:

```bash
cd stripe-webhook-service
./deploy.sh
```

2. Update the Stripe webhook endpoint in the Stripe Dashboard to point to your production webhook URL.

3. Update the API URLs in your frontend components to point to your production API endpoints.

4. Deploy your frontend application.

## Troubleshooting

### Webhook Events Not Being Received

1. Check that your webhook endpoint is publicly accessible.
2. Verify that the webhook signing secret is correct.
3. Check the Stripe Dashboard for webhook delivery attempts and errors.

### Credits Not Being Added to User Account

1. Check the webhook service logs for errors.
2. Verify that the user exists in the Firestore database.
3. Check that the Stripe customer ID is correctly associated with the user.

### Checkout Session Creation Failing

1. Verify that the Stripe API key is correct.
2. Check that the plan ID exists in the Firestore database.
3. Ensure that the base URL is correct and accessible.

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
