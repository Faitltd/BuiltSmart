"""
Zoho Books Integration Module

This module provides functionality to update Zoho Books with product data.
"""

import json
import logging
import requests
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)

class ZohoBooks:
    """Client for interacting with Zoho Books API."""
    
    def __init__(self, client_id, client_secret, organization_id, refresh_token):
        """Initialize the Zoho Books client.
        
        Args:
            client_id (str): Zoho OAuth client ID
            client_secret (str): Zoho OAuth client secret
            organization_id (str): Zoho Books organization ID
            refresh_token (str): Zoho OAuth refresh token
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.organization_id = organization_id
        self.refresh_token = refresh_token
        self.access_token = None
        self.token_expiry = None
        
        # Base URLs
        self.auth_url = "https://accounts.zoho.com/oauth/v2/token"
        self.api_url = "https://books.zoho.com/api/v3"
    
    def get_access_token(self):
        """Get a valid access token, refreshing if necessary.
        
        Returns:
            str: Access token
        """
        # Check if we have a valid token
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        # Get a new token
        params = {
            'refresh_token': self.refresh_token,
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'grant_type': 'refresh_token'
        }
        
        try:
            response = requests.post(self.auth_url, data=params)
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data.get('access_token')
            
            # Set token expiry (typically 1 hour)
            expires_in = data.get('expires_in', 3600)
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in)
            
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get access token: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            raise
    
    def get_items(self, page=1, per_page=200):
        """Get items from Zoho Books.
        
        Args:
            page (int): Page number
            per_page (int): Number of items per page
            
        Returns:
            list: List of items
        """
        access_token = self.get_access_token()
        
        headers = {
            'Authorization': f'Zoho-oauthtoken {access_token}'
        }
        
        params = {
            'organization_id': self.organization_id,
            'page': page,
            'per_page': per_page
        }
        
        try:
            response = requests.get(f"{self.api_url}/items", headers=headers, params=params)
            response.raise_for_status()
            
            return response.json().get('items', [])
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get items: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            raise
    
    def create_item(self, item_data):
        """Create a new item in Zoho Books.
        
        Args:
            item_data (dict): Item data
            
        Returns:
            dict: Created item data
        """
        access_token = self.get_access_token()
        
        headers = {
            'Authorization': f'Zoho-oauthtoken {access_token}',
            'Content-Type': 'application/json'
        }
        
        params = {
            'organization_id': self.organization_id
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/items", 
                headers=headers, 
                params=params,
                data=json.dumps(item_data)
            )
            response.raise_for_status()
            
            return response.json().get('item', {})
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to create item: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            raise
    
    def update_item(self, item_id, item_data):
        """Update an existing item in Zoho Books.
        
        Args:
            item_id (str): Item ID
            item_data (dict): Updated item data
            
        Returns:
            dict: Updated item data
        """
        access_token = self.get_access_token()
        
        headers = {
            'Authorization': f'Zoho-oauthtoken {access_token}',
            'Content-Type': 'application/json'
        }
        
        params = {
            'organization_id': self.organization_id
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/items/{item_id}", 
                headers=headers, 
                params=params,
                data=json.dumps(item_data)
            )
            response.raise_for_status()
            
            return response.json().get('item', {})
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to update item: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            raise
    
    def update_items_from_products(self, products):
        """Update Zoho Books items from scraped products.
        
        Args:
            products (list): List of scraped products
            
        Returns:
            dict: Summary of updates
        """
        logger.info(f"Updating Zoho Books with {len(products)} products")
        
        # Get existing items
        existing_items = self.get_items()
        
        # Create a lookup by SKU
        item_by_sku = {}
        for item in existing_items:
            sku = item.get('sku')
            if sku:
                item_by_sku[sku] = item
        
        # Track results
        created = 0
        updated = 0
        skipped = 0
        errors = 0
        
        for product in products:
            try:
                # Skip products without SKU
                sku = product.get('sku')
                if not sku:
                    logger.warning(f"Skipping product without SKU: {product.get('name')}")
                    skipped += 1
                    continue
                
                # Prepare item data
                item_data = {
                    'name': product.get('name', ''),
                    'sku': sku,
                    'description': product.get('description', ''),
                    'rate': product.get('price', 0),
                    'product_type': 'goods'
                }
                
                # Add custom fields for additional data
                custom_fields = []
                
                # Add URL as custom field
                if product.get('url'):
                    custom_fields.append({
                        'label': 'Product URL',
                        'value': product.get('url')
                    })
                
                # Add specifications as custom fields
                if product.get('specifications'):
                    specs_text = []
                    for spec in product.get('specifications'):
                        if spec.get('name') and spec.get('value'):
                            specs_text.append(f"{spec.get('name')}: {spec.get('value')}")
                    
                    if specs_text:
                        custom_fields.append({
                            'label': 'Specifications',
                            'value': '\n'.join(specs_text)
                        })
                
                if custom_fields:
                    item_data['custom_fields'] = custom_fields
                
                # Check if item exists
                if sku in item_by_sku:
                    # Update existing item
                    item_id = item_by_sku[sku].get('item_id')
                    self.update_item(item_id, item_data)
                    updated += 1
                    logger.info(f"Updated item: {item_data['name']} (SKU: {sku})")
                else:
                    # Create new item
                    self.create_item(item_data)
                    created += 1
                    logger.info(f"Created item: {item_data['name']} (SKU: {sku})")
                
            except Exception as e:
                logger.error(f"Error updating item for product {product.get('name')}: {str(e)}")
                errors += 1
        
        summary = {
            'created': created,
            'updated': updated,
            'skipped': skipped,
            'errors': errors,
            'total': len(products)
        }
        
        logger.info(f"Zoho Books update summary: {summary}")
        return summary
