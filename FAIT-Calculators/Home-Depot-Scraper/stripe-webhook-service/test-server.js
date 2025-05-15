/**
 * Test server for Stripe webhook
 *
 * This script runs the webhook service on port 4242 for testing with the Stripe CLI.
 */

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_MASTER_API_KEY);
const { Firestore } = require('@google-cloud/firestore');

// Configure Express
const app = express();
const port = 4242;

// Configure Firestore
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'fait-444705';
const db = new Firestore({
  projectId: projectId
});

// Middleware to handle different content types
// For webhook endpoints that need raw body
app.use('/webhook', express.raw({type: 'application/json'}));

// For other endpoints that need parsed JSON
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf.toString();
      }
    })(req, res, next);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Stripe webhook test server is running', status: 'ok' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'stripe-webhook-test' });
});

// Stripe webhook endpoint
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Replace this endpoint secret with your endpoint's unique secret
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Received webhook at /webhook endpoint');

  let event;

  try {
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      try {
        // Verify the event using the webhook secret
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
      }
    } else {
      // If no webhook secret is configured, parse the event without verification
      event = JSON.parse(req.body.toString());
      console.warn('⚠️  No webhook secret configured. Skipping signature verification.');
      console.log('To get a webhook secret, run: stripe listen --forward-to localhost:4242/webhook');
    }

    // Log the event type and full event data
    console.log(`Processing event type: ${event.type}`);
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    // Return a 200 response immediately to acknowledge receipt of the event
    res.send();

    // Handle the event with a switch statement
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        // In test mode, just log the session details
        console.log('Session details:', session);
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // In test mode, just log the payment intent details
        console.log('Payment intent details:', paymentIntent);
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`PaymentMethod ${paymentMethod.id} was attached!`);
        // In test mode, just log the payment method details
        console.log('Payment method details:', paymentMethod);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Stripe webhook test server running on port ${port}`);
  console.log(`Webhook URL: http://localhost:${port}/webhook`);
  console.log('Use the following command to forward events:');
  console.log(`stripe listen --forward-to localhost:${port}/webhook`);
});
