#!/usr/bin/env python3
"""
Firestore Database Utility Module

This module provides functions for interacting with the Firestore database
for user management and credit tracking.
"""

import os
import logging
import uuid
import hashlib
from datetime import datetime
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Default project ID from environment variable
DEFAULT_PROJECT_ID = os.getenv('GOOGLE_CLOUD_PROJECT', 'fait-444705')

class FirestoreDB:
    """Firestore database utility class for the scraper service."""
    
    def __init__(self, project_id=None):
        """
        Initialize the Firestore database client.
        
        Args:
            project_id (str): Google Cloud project ID
        """
        self.db = firestore.Client(project=project_id or DEFAULT_PROJECT_ID)
        logger.info(f"Connected to Firestore in project: {project_id or DEFAULT_PROJECT_ID}")
    
    # User Management
    
    def create_user(self, email, name, stripe_customer_id=None):
        """
        Create a new user in the database.
        
        Args:
            email (str): User's email address
            name (str): User's name
            stripe_customer_id (str): Stripe customer ID
            
        Returns:
            dict: Created user data including the API key
        """
        # Check if user already exists
        existing_user = self.get_user_by_email(email)
        if existing_user:
            logger.warning(f"User with email {email} already exists")
            return existing_user
        
        # Generate a unique API key
        api_key = self._generate_api_key()
        
        # Create user document
        user_data = {
            'email': email,
            'name': name,
            'api_key': api_key,
            'credits': 0,  # Start with 0 credits
            'stripe_customer_id': stripe_customer_id,
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        # Add user to Firestore
        user_ref = self.db.collection('users').document()
        user_ref.set(user_data)
        
        # Get the user ID
        user_id = user_ref.id
        
        # Return the user data with the ID
        user_data['id'] = user_id
        
        logger.info(f"Created user: {user_id}")
        return user_data
    
    def get_user_by_id(self, user_id):
        """
        Get a user by ID.
        
        Args:
            user_id (str): User ID
            
        Returns:
            dict: User data or None if not found
        """
        user_ref = self.db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            logger.warning(f"User with ID {user_id} not found")
            return None
        
        user_data = user.to_dict()
        user_data['id'] = user_id
        
        return user_data
    
    def get_user_by_email(self, email):
        """
        Get a user by email.
        
        Args:
            email (str): User's email address
            
        Returns:
            dict: User data or None if not found
        """
        users_ref = self.db.collection('users')
        query = users_ref.where(filter=FieldFilter("email", "==", email))
        
        users = query.stream()
        
        for user in users:
            user_data = user.to_dict()
            user_data['id'] = user.id
            return user_data
        
        logger.warning(f"User with email {email} not found")
        return None
    
    def get_user_by_api_key(self, api_key):
        """
        Get a user by API key.
        
        Args:
            api_key (str): User's API key
            
        Returns:
            dict: User data or None if not found
        """
        users_ref = self.db.collection('users')
        query = users_ref.where(filter=FieldFilter("api_key", "==", api_key))
        
        users = query.stream()
        
        for user in users:
            user_data = user.to_dict()
            user_data['id'] = user.id
            return user_data
        
        logger.warning(f"User with API key {api_key[:4]}...{api_key[-4:]} not found")
        return None
    
    def update_user(self, user_id, data):
        """
        Update a user's data.
        
        Args:
            user_id (str): User ID
            data (dict): Data to update
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Add updated_at timestamp
        data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        user_ref = self.db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            logger.warning(f"User with ID {user_id} not found")
            return False
        
        user_ref.update(data)
        logger.info(f"Updated user: {user_id}")
        
        return True
    
    def regenerate_api_key(self, user_id):
        """
        Regenerate a user's API key.
        
        Args:
            user_id (str): User ID
            
        Returns:
            str: New API key or None if user not found
        """
        user_ref = self.db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            logger.warning(f"User with ID {user_id} not found")
            return None
        
        # Generate a new API key
        api_key = self._generate_api_key()
        
        # Update the user document
        user_ref.update({
            'api_key': api_key,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        logger.info(f"Regenerated API key for user: {user_id}")
        return api_key
    
    # Credit Management
    
    def add_credits(self, user_id, credits, description, stripe_payment_id=None):
        """
        Add credits to a user's account and record the transaction.
        
        Args:
            user_id (str): User ID
            credits (int): Number of credits to add
            description (str): Transaction description
            stripe_payment_id (str): Stripe payment ID
            
        Returns:
            dict: Updated user data or None if user not found
        """
        # Get the user
        user_ref = self.db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            logger.warning(f"User with ID {user_id} not found")
            return None
        
        user_data = user.to_dict()
        current_credits = user_data.get('credits', 0)
        
        # Update the user's credits
        new_credits = current_credits + credits
        user_ref.update({
            'credits': new_credits,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Record the transaction
        transaction_data = {
            'user_id': user_id,
            'type': 'purchase',
            'amount': credits,
            'description': description,
            'stripe_payment_id': stripe_payment_id,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        self.db.collection('transactions').add(transaction_data)
        
        logger.info(f"Added {credits} credits to user {user_id}, new balance: {new_credits}")
        
        # Return the updated user data
        user_data['id'] = user_id
        user_data['credits'] = new_credits
        
        return user_data
    
    def use_credits(self, user_id, credits, description):
        """
        Use credits from a user's account and record the transaction.
        
        Args:
            user_id (str): User ID
            credits (int): Number of credits to use
            description (str): Transaction description
            
        Returns:
            dict: Updated user data or None if user not found or insufficient credits
        """
        # Get the user
        user_ref = self.db.collection('users').document(user_id)
        user = user_ref.get()
        
        if not user.exists:
            logger.warning(f"User with ID {user_id} not found")
            return None
        
        user_data = user.to_dict()
        current_credits = user_data.get('credits', 0)
        
        # Check if the user has enough credits
        if current_credits < credits:
            logger.warning(f"User {user_id} has insufficient credits: {current_credits} < {credits}")
            return None
        
        # Update the user's credits
        new_credits = current_credits - credits
        user_ref.update({
            'credits': new_credits,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        # Record the transaction
        transaction_data = {
            'user_id': user_id,
            'type': 'usage',
            'amount': -credits,  # Negative amount for usage
            'description': description,
            'created_at': firestore.SERVER_TIMESTAMP
        }
        
        self.db.collection('transactions').add(transaction_data)
        
        logger.info(f"Used {credits} credits from user {user_id}, new balance: {new_credits}")
        
        # Return the updated user data
        user_data['id'] = user_id
        user_data['credits'] = new_credits
        
        return user_data
    
    def get_user_transactions(self, user_id, limit=10):
        """
        Get a user's transaction history.
        
        Args:
            user_id (str): User ID
            limit (int): Maximum number of transactions to return
            
        Returns:
            list: List of transaction data
        """
        transactions_ref = self.db.collection('transactions')
        query = transactions_ref.where(filter=FieldFilter("user_id", "==", user_id)).order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
        
        transactions = []
        for transaction in query.stream():
            transaction_data = transaction.to_dict()
            transaction_data['id'] = transaction.id
            transactions.append(transaction_data)
        
        return transactions
    
    # Plans Management
    
    def get_plans(self):
        """
        Get all pricing plans.
        
        Returns:
            list: List of plan data
        """
        plans_ref = self.db.collection('plans')
        
        plans = []
        for plan in plans_ref.stream():
            plan_data = plan.to_dict()
            plan_data['id'] = plan.id
            plans.append(plan_data)
        
        return plans
    
    def get_plan_by_id(self, plan_id):
        """
        Get a plan by ID.
        
        Args:
            plan_id (str): Plan ID
            
        Returns:
            dict: Plan data or None if not found
        """
        plan_ref = self.db.collection('plans').document(plan_id)
        plan = plan_ref.get()
        
        if not plan.exists:
            logger.warning(f"Plan with ID {plan_id} not found")
            return None
        
        plan_data = plan.to_dict()
        plan_data['id'] = plan_id
        
        return plan_data
    
    def get_plan_by_stripe_price_id(self, stripe_price_id):
        """
        Get a plan by Stripe price ID.
        
        Args:
            stripe_price_id (str): Stripe price ID
            
        Returns:
            dict: Plan data or None if not found
        """
        plans_ref = self.db.collection('plans')
        query = plans_ref.where(filter=FieldFilter("stripe_price_id", "==", stripe_price_id))
        
        plans = query.stream()
        
        for plan in plans:
            plan_data = plan.to_dict()
            plan_data['id'] = plan.id
            return plan_data
        
        logger.warning(f"Plan with Stripe price ID {stripe_price_id} not found")
        return None
    
    # Costs Management
    
    def get_costs(self):
        """
        Get the credit costs for different operations.
        
        Returns:
            dict: Cost data or default costs if not found
        """
        costs_ref = self.db.collection('costs').document('default')
        costs = costs_ref.get()
        
        if not costs.exists:
            logger.warning("Costs not found, using defaults")
            return {
                'product_scrape': 1,
                'search_scrape': 5,
                'category_scrape': 10
            }
        
        return costs.to_dict()
    
    # Helper Methods
    
    def _generate_api_key(self):
        """
        Generate a unique API key.
        
        Returns:
            str: Generated API key
        """
        # Generate a random UUID
        random_uuid = uuid.uuid4()
        
        # Create a hash of the UUID
        hash_object = hashlib.sha256(str(random_uuid).encode())
        hash_hex = hash_object.hexdigest()
        
        # Use the first 32 characters as the API key
        api_key = hash_hex[:32].upper()
        
        return api_key
