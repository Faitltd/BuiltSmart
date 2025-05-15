/**
 * Stripe Webhook Service
 *
 * This service processes Stripe webhook events and adds credits to user accounts.
 */

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_MASTER_API_KEY);
const { Firestore } = require('@google-cloud/firestore');

// Configure Express
const app = express();
const port = process.env.PORT || 8080;

// Configure Firestore
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'fait-444705';
const db = new Firestore({
  projectId: projectId
});

// Middleware to handle different content types
// For webhook endpoints that need raw body for signature verification
app.use('/webhook', express.raw({type: 'application/json'}));
app.use('/webhook/stripe', express.raw({type: 'application/json'}));

// For other endpoints that need parsed JSON
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook' || req.originalUrl === '/webhook/stripe') {
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
  res.json({ message: 'Stripe webhook service is running', status: 'ok' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'scraper-webhook' });
});

// New Stripe webhook endpoint at /webhook
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Get the webhook secret from environment variables
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Received webhook at /webhook endpoint');

  let event;

  try {
    // SECURITY: Always verify the event signature if possible
    if (endpointSecret) {
      try {
        // Verify the event using the webhook secret and signature
        event = stripe.webhooks.constructEvent(
          req.body, // raw body from express.raw middleware
          sig,
          endpointSecret
        );
        console.log('✅ Webhook signature verification successful');
      } catch (err) {
        // SECURITY: Log detailed error for debugging but return generic error to client
        console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        console.error(`Headers: ${JSON.stringify(req.headers)}`);
        return res.status(400).send('Webhook signature verification failed');
      }
    } else {
      // SECURITY WARNING: This is insecure and should only be used in development
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ SECURITY WARNING: No webhook secret configured. Skipping signature verification.');
      console.warn('⚠️ This is insecure and should not be used in production.');
    }

    // Log the event type
    console.log(`Processing event type: ${event.type}`);

    // Return a 200 response immediately to acknowledge receipt of the event
    res.send();

    // Handle the event with a switch statement
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        // Process the completed checkout session asynchronously
        processCheckoutSession(session).catch(error => {
          console.error(`Error processing checkout session: ${error.message}`);
        });
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // Handle the successful payment intent asynchronously
        handlePaymentIntentSucceeded(paymentIntent).catch(error => {
          console.error(`Error handling payment intent: ${error.message}`);
        });
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`PaymentMethod ${paymentMethod.id} was attached!`);
        // Handle the payment method attachment asynchronously
        handlePaymentMethodAttached(paymentMethod).catch(error => {
          console.error(`Error handling payment method attachment: ${error.message}`);
        });
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

// Original Stripe webhook endpoint
app.post('/webhook/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  // Get the webhook secret from environment variables
  // If you are testing with the CLI, find the secret by running 'stripe listen'
  // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
  // at https://dashboard.stripe.com/webhooks
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Received webhook from Stripe at /webhook/stripe endpoint');

  let event;

  try {
    // SECURITY: Always verify the event signature if possible
    if (endpointSecret) {
      try {
        // Verify the event using the webhook secret and signature
        event = stripe.webhooks.constructEvent(
          req.body, // raw body from express.raw middleware
          sig,
          endpointSecret
        );
        console.log('✅ Webhook signature verification successful');
      } catch (err) {
        // SECURITY: Log detailed error for debugging but return generic error to client
        console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
        console.error(`Headers: ${JSON.stringify(req.headers)}`);
        return res.status(400).send('Webhook signature verification failed');
      }
    } else {
      // SECURITY WARNING: This is insecure and should only be used in development
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ SECURITY WARNING: No webhook secret configured. Skipping signature verification.');
      console.warn('⚠️ This is insecure and should not be used in production.');
    }

    // Log the event type
    console.log(`Processing event type: ${event.type}`);

    // Return a 200 response immediately to acknowledge receipt of the event
    res.json({ status: 'success', event_type: event.type });

    // Handle the event with a switch statement
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log(`Checkout session completed: ${session.id}`);
        // Process the completed checkout session asynchronously
        processCheckoutSession(session).catch(error => {
          console.error(`Error processing checkout session: ${error.message}`);
        });
        break;
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
        // Handle the successful payment intent asynchronously
        handlePaymentIntentSucceeded(paymentIntent).catch(error => {
          console.error(`Error handling payment intent: ${error.message}`);
        });
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        console.log(`PaymentMethod ${paymentMethod.id} was attached!`);
        // Handle the payment method attachment asynchronously
        handlePaymentMethodAttached(paymentMethod).catch(error => {
          console.error(`Error handling payment method attachment: ${error.message}`);
        });
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

/**
 * Process a completed checkout session
 */
async function processCheckoutSession(session) {
  try {
    console.log(`Processing checkout session: ${session.id}`);

    // Get the customer ID from the session
    const customerId = session.customer;
    if (!customerId) {
      console.error('No customer ID in session');
      return;
    }

    // Get the line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    if (!lineItems || !lineItems.data || lineItems.data.length === 0) {
      console.error('No line items in session');
      return;
    }

    // Get the price ID from the first line item
    const priceId = lineItems.data[0].price.id;

    // Get the plan from the database
    const plansRef = db.collection('plans');
    const plansSnapshot = await plansRef.where('stripe_price_id', '==', priceId).get();

    if (plansSnapshot.empty) {
      console.error(`Plan not found for price ID: ${priceId}`);
      return;
    }

    const plan = plansSnapshot.docs[0].data();
    plan.id = plansSnapshot.docs[0].id;

    // Get the user by Stripe customer ID
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('stripe_customer_id', '==', customerId).get();

    let user = null;
    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      user = userDoc.data();
      user.id = userDoc.id;
    } else {
      // If user doesn't exist, we might need to create one
      console.log(`User not found for customer ID: ${customerId}`);

      // Get customer details from Stripe
      const customer = await stripe.customers.retrieve(customerId);

      // Create a new user
      const newUser = {
        email: customer.email,
        name: customer.name || customer.email,
        api_key: generateApiKey(),
        credits: 0,
        stripe_customer_id: customerId,
        created_at: Firestore.FieldValue.serverTimestamp(),
        updated_at: Firestore.FieldValue.serverTimestamp()
      };

      const userRef = await usersRef.add(newUser);
      user = newUser;
      user.id = userRef.id;

      console.log(`Created new user: ${user.id}`);
    }

    // Add credits to the user's account
    const credits = plan.credits || 0;
    const description = `Purchased ${credits} credits (${plan.name || 'Unknown plan'})`;

    // Update the user's credits
    const userRef = db.collection('users').doc(user.id);
    await userRef.update({
      credits: Firestore.FieldValue.increment(credits),
      updated_at: Firestore.FieldValue.serverTimestamp()
    });

    // Record the transaction
    const transactionData = {
      user_id: user.id,
      type: 'purchase',
      amount: credits,
      description: description,
      stripe_payment_id: session.payment_intent,
      created_at: Firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').add(transactionData);

    console.log(`Added ${credits} credits to user ${user.id}`);
  } catch (error) {
    console.error(`Error processing checkout session: ${error.message}`);
    console.error(error);
    throw error; // Re-throw the error for proper handling
  }
}

/**
 * Handle a successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    console.log(`Processing payment intent: ${paymentIntent.id}`);

    // Get the customer ID from the payment intent
    const customerId = paymentIntent.customer;
    if (!customerId) {
      console.error('No customer ID in payment intent');
      return;
    }

    // Get the user by Stripe customer ID
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('stripe_customer_id', '==', customerId).get();

    if (usersSnapshot.empty) {
      console.error(`User not found for customer ID: ${customerId}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();
    user.id = userDoc.id;

    // Record the payment in the transactions collection
    const transactionData = {
      user_id: user.id,
      type: 'payment',
      amount: paymentIntent.amount / 100, // Convert from cents to dollars
      description: `Payment of $${(paymentIntent.amount / 100).toFixed(2)}`,
      stripe_payment_id: paymentIntent.id,
      created_at: Firestore.FieldValue.serverTimestamp()
    };

    await db.collection('transactions').add(transactionData);

    console.log(`Recorded payment for user ${user.id}`);
  } catch (error) {
    console.error(`Error handling payment intent: ${error.message}`);
    console.error(error);
  }
}

/**
 * Handle a payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod) {
  try {
    console.log(`Processing payment method attachment: ${paymentMethod.id}`);

    // Get the customer ID from the payment method
    const customerId = paymentMethod.customer;
    if (!customerId) {
      console.error('No customer ID in payment method');
      return;
    }

    // Get the user by Stripe customer ID
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.where('stripe_customer_id', '==', customerId).get();

    if (usersSnapshot.empty) {
      console.error(`User not found for customer ID: ${customerId}`);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const user = userDoc.data();
    user.id = userDoc.id;

    // Update the user with the payment method information
    const userRef = db.collection('users').doc(user.id);
    await userRef.update({
      payment_method_id: paymentMethod.id,
      payment_method_type: paymentMethod.type,
      payment_method_last4: paymentMethod.card ? paymentMethod.card.last4 : null,
      updated_at: Firestore.FieldValue.serverTimestamp()
    });

    console.log(`Updated payment method for user ${user.id}`);
  } catch (error) {
    console.error(`Error handling payment method attachment: ${error.message}`);
    console.error(error);
  }
}

/**
 * Generate a unique API key
 */
function generateApiKey() {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

// API endpoints for plans
app.get('/api/plans', async (req, res) => {
  try {
    const plansRef = db.collection('plans');
    const snapshot = await plansRef.get();

    const plans = [];
    snapshot.forEach(doc => {
      const plan = doc.data();
      plan.id = doc.id;
      plans.push(plan);
    });

    res.json({ status: 'success', plans });
  } catch (error) {
    console.error(`Error getting plans: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API endpoints for users
app.get('/api/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const userRef = db.collection('users').doc(userId);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const userData = user.data();
    userData.id = user.id;

    // Mask the API key for response
    if (userData.api_key) {
      userData.api_key_masked = `${userData.api_key.substring(0, 4)}...${userData.api_key.substring(userData.api_key.length - 4)}`;
      delete userData.api_key;
    }

    res.json({ status: 'success', user: userData });
  } catch (error) {
    console.error(`Error getting user: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API endpoints for transactions
app.get('/api/transactions/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 10;

    // Check if user exists
    const userRef = db.collection('users').doc(userId);
    const user = await userRef.get();

    if (!user.exists) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    // Get transactions
    const transactionsRef = db.collection('transactions');
    const query = transactionsRef
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .limit(limit);

    const snapshot = await query.get();

    const transactions = [];
    snapshot.forEach(doc => {
      const transaction = doc.data();
      transaction.id = doc.id;
      transactions.push(transaction);
    });

    res.json({ status: 'success', transactions });
  } catch (error) {
    console.error(`Error getting transactions: ${error.message}`);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Stripe webhook service listening on port ${port}`);
});

// Export the server for testing
module.exports = { app, server };
