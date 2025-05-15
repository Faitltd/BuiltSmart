"""
Lowe's API Client Module

This module provides a client for interacting with the Backyard API to fetch Lowe's product data.
Backyard API is a specialized API for Lowe's product data, provided by Trajectdata.
"""

import json
import os
import re
import time
import logging
from urllib.parse import urlparse, parse_qs, quote, quote_plus
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

# Configure logging
logger = logging.getLogger(__name__)

class LowesClient:
    """Client for interacting with the Backyard API to fetch Lowe's product data."""

    # Use Backyard API for Lowe's data
    BASE_URL = "https://api.backyardapi.com/request"

    def __init__(self, api_key, max_retries=3, backoff_factor=0.5):
        """Initialize the Lowe's API client.

        Args:
            api_key (str): Your BigBox API key
            max_retries (int): Maximum number of retries for failed requests
            backoff_factor (float): Backoff factor for retries
        """
        self.api_key = api_key
        self.session = self._create_session(max_retries, backoff_factor)

    def _create_session(self, max_retries, backoff_factor):
        """Create a requests session with retry capabilities.

        Args:
            max_retries (int): Maximum number of retries
            backoff_factor (float): Backoff factor for retries

        Returns:
            requests.Session: Configured session object
        """
        session = requests.Session()

        # Configure retry strategy
        retry_strategy = Retry(
            total=max_retries,
            backoff_factor=backoff_factor,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["GET"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)

        return session

    def _make_request(self, params):
        """Make a request to the BigBox API.

        Args:
            params (dict): Request parameters

        Returns:
            dict: API response data

        Raises:
            Exception: If the API request fails
        """
        try:
            logger.debug(f"Making API request with params: {params}")

            # Add timestamp to avoid caching issues
            from datetime import datetime
            params['_t'] = datetime.now().strftime('%Y%m%d%H%M%S')

            # Make the request
            response = self.session.get(self.BASE_URL, params=params)

            # Check for authentication errors specifically
            if response.status_code == 401:
                error_msg = "API key authentication failed. Please check your API key."
                try:
                    error_data = response.json()
                    if 'request_info' in error_data and 'message' in error_data['request_info']:
                        error_msg = f"API authentication error: {error_data['request_info']['message']}"
                except:
                    pass
                logger.error(error_msg)
                raise ValueError(error_msg)

            # Check for other errors
            response.raise_for_status()

            # Parse the response
            result = response.json()

            # Check if the request was successful
            if 'request_info' in result and not result['request_info'].get('success', False):
                error_msg = result['request_info'].get('message', 'Unknown API error')
                logger.error(f"API request failed: {error_msg}")
                raise ValueError(f"API request failed: {error_msg}")

            # Check if we're running low on credits
            if 'request_info' in result:
                credits_remaining = result['request_info'].get('credits_remaining', 0)
                if credits_remaining < 10:
                    logger.warning(f"Running low on API credits: {credits_remaining} remaining")

            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {str(e)}")
            if hasattr(response, 'text'):
                logger.error(f"Response: {response.text}")
            raise
        except ValueError as e:
            # Re-raise ValueError for authentication and API errors
            raise
        except Exception as e:
            logger.error(f"Unexpected error during API request: {str(e)}")
            raise

    def get_product_by_url(self, url):
        """Fetch product details using a Lowe's product URL.

        Args:
            url (str): Lowe's product URL

        Returns:
            dict: Product data from Backyard API
        """
        params = {
            'api_key': self.api_key,
            'type': 'product',
            'url': url,
            # No need to specify source for Backyard API as it's Lowe's-specific
        }

        logger.debug(f"Making request for URL: {url}")
        return self._make_request(params)

    def get_product_by_id(self, item_id):
        """Fetch product details using a Lowe's product ID.

        Args:
            item_id (str): Lowe's product ID

        Returns:
            dict: Product data from Backyard API
        """
        params = {
            'api_key': self.api_key,
            'type': 'product',
            'item_id': item_id,
            # No need to specify source for Backyard API as it's Lowe's-specific
        }

        return self._make_request(params)

    def get_category_products(self, category_id, page=1):
        """Fetch products from a specific category.

        Args:
            category_id (str): Lowe's category ID
            page (int): Page number to fetch

        Returns:
            dict: Category data from Backyard API
        """
        # Backyard API doesn't support 'category' type directly
        # Instead, we'll use 'search' with a category filter and a generic search term
        params = {
            'api_key': self.api_key,
            'type': 'search',  # Use search instead of category
            'search_term': '*',  # Generic search term to get all products
            'page': page,
            'category': category_id,  # Filter by category
            # No need to specify source for Backyard API as it's Lowe's-specific
        }

        return self._make_request(params)

    def search_products(self, search_term, page=1, sort_by=None):
        """Fetch products using a search term.

        Args:
            search_term (str): Search term to find products
            page (int): Page number to fetch
            sort_by (str, optional): How to sort results (e.g., 'best_seller')

        Returns:
            dict: Search results data from Backyard API
        """
        params = {
            'api_key': self.api_key,
            'type': 'search',
            'search_term': search_term,
            'page': page,
            # No need to specify source for Backyard API as it's Lowe's-specific
        }

        if sort_by:
            params['sort_by'] = sort_by

        return self._make_request(params)

    def extract_product_id_from_url(self, url):
        """Extract the product ID from a Lowe's product URL.

        Args:
            url (str): Lowe's product URL

        Returns:
            str: Product ID or None if not found
        """
        # Example Lowe's URL: https://www.lowes.com/pd/product-name/1234567890
        try:
            parsed_url = urlparse(url)
            if 'lowes.com' not in parsed_url.netloc:
                return None

            # Extract the product ID from the path
            path_parts = parsed_url.path.strip('/').split('/')
            if len(path_parts) >= 3 and path_parts[0] == 'pd':
                return path_parts[-1]  # Last part should be the product ID

            return None
        except Exception as e:
            logger.error(f"Error extracting product ID from URL: {str(e)}")
            return None

    def browse_category(self, category_id, page=1, sort_by=None):
        """Browse products in a category.

        Args:
            category_id (str): Category ID to browse
            page (int): Page number to retrieve
            sort_by (str, optional): How to sort results (e.g., 'best_seller')

        Returns:
            dict: Category browse results data
        """
        logger.info(f"Browsing category: {category_id} (page {page})")
        
        # Construct the API URL
        url = f"{self.base_url}/browse"
        
        # Prepare parameters
        params = {
            "api_key": self.api_key,
            "type": "category",
            "category_id": category_id,
            "page": page,
            "store_id": self.store_id
        }
        
        # Add sort parameter if provided
        if sort_by:
            params["sort_by"] = sort_by
        
        # Make the request
        response = self._make_request(url, params)
        
        # Log the response structure for debugging
        if response:
            logger.debug(f"Response keys: {list(response.keys())}")
            if 'products' in response:
                logger.info(f"Found {len(response['products'])} products in category")
            else:
                logger.warning("No products found in category response")
                # Try to find where the products might be in the response
                for key in response.keys():
                    if isinstance(response[key], list) and len(response[key]) > 0:
                        logger.debug(f"Potential products in key '{key}': {len(response[key])} items")
        else:
            logger.warning("Empty response from API")
        
        return response
