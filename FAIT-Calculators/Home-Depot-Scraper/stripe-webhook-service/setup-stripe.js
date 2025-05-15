#!/usr/bin/env node
/**
 * Stripe Products Setup Script
 * 
 * This script creates Stripe products and prices for the scraper service
 * and updates the Firestore database with the Stripe price IDs.
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_MASTER_API_KEY);
const { Firestore } = require('@google-cloud/firestore');

// Configure Firestore
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'fait-444705';
const db = new Firestore({
  projectId: projectId
});

/**
 * Create Stripe products and prices
 */
async function createStripeProducts() {
  console.log('Creating Stripe products and prices...');
  
  const products = {};
  
  try {
    // Basic plan
    const basicProduct = await stripe.products.create({
      name: "Basic Scraper Credits",
      description: "100 credits for the scraper service"
    });
    
    const basicPrice = await stripe.prices.create({
      product: basicProduct.id,
      unit_amount: 999,  // $9.99
      currency: "usd",
      nickname: "Basic Plan"
    });
    
    products.basic = basicPrice.id;
    console.log(`Created Basic plan: ${basicPrice.id}`);
    
    // Standard plan
    const standardProduct = await stripe.products.create({
      name: "Standard Scraper Credits",
      description: "250 credits for the scraper service"
    });
    
    const standardPrice = await stripe.prices.create({
      product: standardProduct.id,
      unit_amount: 1999,  // $19.99
      currency: "usd",
      nickname: "Standard Plan"
    });
    
    products.standard = standardPrice.id;
    console.log(`Created Standard plan: ${standardPrice.id}`);
    
    // Premium plan
    const premiumProduct = await stripe.products.create({
      name: "Premium Scraper Credits",
      description: "1000 credits for the scraper service"
    });
    
    const premiumPrice = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 4999,  // $49.99
      currency: "usd",
      nickname: "Premium Plan"
    });
    
    products.premium = premiumPrice.id;
    console.log(`Created Premium plan: ${premiumPrice.id}`);
    
    return products;
  } catch (error) {
    console.error('Error creating Stripe products:', error);
    throw error;
  }
}

/**
 * Update Firestore plans with Stripe price IDs
 */
async function updateFirestorePlans(products) {
  console.log('Updating Firestore plans with Stripe price IDs...');
  
  try {
    // Update plans in Firestore
    for (const [planId, priceId] of Object.entries(products)) {
      const planRef = db.collection('plans').doc(planId);
      const plan = await planRef.get();
      
      if (plan.exists) {
        await planRef.update({
          stripe_price_id: priceId,
          updated_at: Firestore.FieldValue.serverTimestamp()
        });
        console.log(`Updated ${planId} plan with price ID: ${priceId}`);
      } else {
        console.warn(`Plan ${planId} not found in Firestore`);
        
        // Create the plan if it doesn't exist
        const planData = {
          name: planId.charAt(0).toUpperCase() + planId.slice(1),
          description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} scraping plan`,
          price_usd: planId === 'basic' ? 9.99 : (planId === 'standard' ? 19.99 : 49.99),
          credits: planId === 'basic' ? 100 : (planId === 'standard' ? 250 : 1000),
          stripe_price_id: priceId,
          created_at: Firestore.FieldValue.serverTimestamp(),
          updated_at: Firestore.FieldValue.serverTimestamp()
        };
        
        await planRef.set(planData);
        console.log(`Created ${planId} plan with price ID: ${priceId}`);
      }
    }
    
    console.log('Firestore plans updated with Stripe price IDs');
  } catch (error) {
    console.error('Error updating Firestore plans:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Check if Stripe API key is set
    if (!process.env.STRIPE_MASTER_API_KEY) {
      console.error('STRIPE_MASTER_API_KEY environment variable not set');
      process.exit(1);
    }
    
    // Create Stripe products and prices
    const products = await createStripeProducts();
    
    // Update Firestore plans with Stripe price IDs
    await updateFirestorePlans(products);
    
    console.log('Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the main function
main();
