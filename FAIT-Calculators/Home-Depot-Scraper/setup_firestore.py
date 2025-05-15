#!/usr/bin/env python3
"""
Firestore Database Setup Script

This script initializes the Firestore database for the scraper service with credit management.
It creates the necessary collections and documents for user management and credit tracking.
"""

import os
import argparse
import logging
from datetime import datetime
from google.cloud import firestore
from dotenv import load_dotenv

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

def initialize_database(project_id=None, create_test_data=False):
    """
    Initialize the Firestore database with the necessary collections and documents.
    
    Args:
        project_id (str): Google Cloud project ID
        create_test_data (bool): Whether to create test data
    """
    # Initialize Firestore client
    db = firestore.Client(project=project_id)
    logger.info(f"Connected to Firestore in project: {project_id}")
    
    # Create users collection if it doesn't exist
    # In Firestore, collections are created implicitly when documents are added
    
    # Create pricing plans
    plans_ref = db.collection('plans')
    
    basic_plan = {
        'name': 'Basic',
        'description': 'Basic scraping plan with limited credits',
        'price_usd': 9.99,
        'credits': 100,
        'stripe_price_id': 'price_basic',  # Replace with actual Stripe price ID
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    
    standard_plan = {
        'name': 'Standard',
        'description': 'Standard scraping plan with more credits',
        'price_usd': 19.99,
        'credits': 250,
        'stripe_price_id': 'price_standard',  # Replace with actual Stripe price ID
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    
    premium_plan = {
        'name': 'Premium',
        'description': 'Premium scraping plan with unlimited credits',
        'price_usd': 49.99,
        'credits': 1000,
        'stripe_price_id': 'price_premium',  # Replace with actual Stripe price ID
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    
    # Add plans to Firestore
    plans_ref.document('basic').set(basic_plan)
    plans_ref.document('standard').set(standard_plan)
    plans_ref.document('premium').set(premium_plan)
    
    logger.info("Created pricing plans")
    
    # Create credit costs for different operations
    costs_ref = db.collection('costs')
    
    costs = {
        'product_scrape': 1,  # 1 credit per product
        'search_scrape': 5,   # 5 credits per search
        'category_scrape': 10, # 10 credits per category
        'created_at': firestore.SERVER_TIMESTAMP,
        'updated_at': firestore.SERVER_TIMESTAMP
    }
    
    costs_ref.document('default').set(costs)
    logger.info("Created credit costs")
    
    # Create test data if requested
    if create_test_data:
        # Create a test user
        users_ref = db.collection('users')
        
        test_user = {
            'email': 'test@example.com',
            'name': 'Test User',
            'api_key': 'test_api_key_12345',
            'credits': 100,
            'stripe_customer_id': 'cus_test12345',  # Replace with actual Stripe customer ID
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        users_ref.document('test_user').set(test_user)
        logger.info("Created test user")
        
        # Create test transactions
        transactions_ref = db.collection('transactions')
        
        purchase_transaction = {
            'user_id': 'test_user',
            'type': 'purchase',
            'amount': 100,
            'description': 'Purchased 100 credits',
            'stripe_payment_id': 'pi_test12345',  # Replace with actual Stripe payment ID
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        usage_transaction = {
            'user_id': 'test_user',
            'type': 'usage',
            'amount': -10,
            'description': 'Used 10 credits for product scraping',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        transactions_ref.add(purchase_transaction)
        transactions_ref.add(usage_transaction)
        logger.info("Created test transactions")
    
    logger.info("Database initialization complete")

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description='Initialize Firestore database for scraper service')
    parser.add_argument('--project-id', help='Google Cloud project ID', default=DEFAULT_PROJECT_ID)
    parser.add_argument('--test-data', action='store_true', help='Create test data')
    
    args = parser.parse_args()
    
    try:
        initialize_database(project_id=args.project_id, create_test_data=args.test_data)
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
