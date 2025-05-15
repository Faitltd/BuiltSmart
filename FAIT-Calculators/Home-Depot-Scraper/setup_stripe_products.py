#!/usr/bin/env python3
"""
Stripe Products Setup Script

This script creates Stripe products and prices for the scraper service
and updates the Firestore database with the Stripe price IDs.
"""

import os
import argparse
import logging
import stripe
from dotenv import load_dotenv
from db import FirestoreDB

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Default project ID from environment variable
DEFAULT_PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

# Configure Stripe
stripe_api_key = os.getenv('STRIPE_MASTER_API_KEY')
stripe.api_key = stripe_api_key

def create_stripe_products():
    """
    Create Stripe products and prices for the scraper service.
    
    Returns:
        dict: Dictionary of plan IDs and their Stripe price IDs
    """
    # Create products and prices
    products = {}
    
    # Basic plan
    basic_product = stripe.Product.create(
        name="Basic Scraper Credits",
        description="100 credits for the scraper service"
    )
    
    basic_price = stripe.Price.create(
        product=basic_product.id,
        unit_amount=999,  # $9.99
        currency="usd",
        nickname="Basic Plan"
    )
    
    products['basic'] = basic_price.id
    logger.info(f"Created Basic plan: {basic_price.id}")
    
    # Standard plan
    standard_product = stripe.Product.create(
        name="Standard Scraper Credits",
        description="250 credits for the scraper service"
    )
    
    standard_price = stripe.Price.create(
        product=standard_product.id,
        unit_amount=1999,  # $19.99
        currency="usd",
        nickname="Standard Plan"
    )
    
    products['standard'] = standard_price.id
    logger.info(f"Created Standard plan: {standard_price.id}")
    
    # Premium plan
    premium_product = stripe.Product.create(
        name="Premium Scraper Credits",
        description="1000 credits for the scraper service"
    )
    
    premium_price = stripe.Price.create(
        product=premium_product.id,
        unit_amount=4999,  # $49.99
        currency="usd",
        nickname="Premium Plan"
    )
    
    products['premium'] = premium_price.id
    logger.info(f"Created Premium plan: {premium_price.id}")
    
    return products

def update_firestore_plans(products, project_id=None):
    """
    Update Firestore plans with Stripe price IDs.
    
    Args:
        products (dict): Dictionary of plan IDs and their Stripe price IDs
        project_id (str): Google Cloud project ID
    """
    # Initialize Firestore client
    db = FirestoreDB(project_id=project_id)
    logger.info(f"Connected to Firestore in project: {project_id or DEFAULT_PROJECT_ID}")
    
    # Update plans in Firestore
    for plan_id, price_id in products.items():
        plan_ref = db.db.collection('plans').document(plan_id)
        plan = plan_ref.get()
        
        if plan.exists:
            plan_ref.update({
                'stripe_price_id': price_id,
                'updated_at': db.db.SERVER_TIMESTAMP
            })
            logger.info(f"Updated {plan_id} plan with price ID: {price_id}")
        else:
            logger.warning(f"Plan {plan_id} not found in Firestore")
    
    logger.info("Firestore plans updated with Stripe price IDs")

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Set up Stripe products and update Firestore')
    parser.add_argument('--project-id', help='Google Cloud project ID', default=DEFAULT_PROJECT_ID)
    
    args = parser.parse_args()
    
    try:
        # Check if Stripe API key is set
        if not stripe_api_key:
            logger.error("STRIPE_MASTER_API_KEY environment variable not set")
            return 1
        
        # Create Stripe products and prices
        products = create_stripe_products()
        
        # Update Firestore plans with Stripe price IDs
        update_firestore_plans(products, project_id=args.project_id)
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        return 1
    except Exception as e:
        logger.error(f"Error setting up Stripe products: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
