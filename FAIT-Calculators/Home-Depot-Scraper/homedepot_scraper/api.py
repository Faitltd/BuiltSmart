"""
Home Depot API Client Module

This module provides a client for interacting with the BigBox API to fetch Home Depot product data.
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

class HomeDepotClient:
    """Client for interacting with the BigBox API to fetch Home Depot product data."""

    BASE_URL = "https://api.bigboxapi.com/request"

    def __init__(self, api_key, max_retries=3, backoff_factor=0.5):
        """Initialize the Home Depot API client.

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

    def extract_product_id(self, url):
        """Extract the product ID from a Home Depot URL.

        Args:
            url (str): Home Depot product URL

        Returns:
            str: Product ID or None if not found
        """
        # Handle URLs with /p/ format
        p_match = re.search(r'/p/[^/]+/(\d+)', url)
        if p_match:
            return p_match.group(1)

        # Try parsing the URL path
        path = urlparse(url).path
        parts = path.strip('/').split('/')

        # Look for numeric IDs in the URL path
        for part in parts:
            if part.isdigit() and len(part) > 5:  # Product IDs are typically longer
                return part

        return None

    def get_product_by_url(self, url):
        """Fetch product details using a Home Depot product URL.

        Args:
            url (str): Home Depot product URL

        Returns:
            dict: Product data from BigBox API
        """
        params = {
            'api_key': self.api_key,
            'type': 'product',
            'url': url  # Don't encode here, requests will handle it
        }

        logger.debug(f"Making request for URL: {url}")
        return self._make_request(params)

    def get_product_by_id(self, item_id):
        """Fetch product details using a Home Depot product ID.

        Args:
            item_id (str): Home Depot product ID

        Returns:
            dict: Product data from BigBox API
        """
        params = {
            'api_key': self.api_key,
            'type': 'product',
            'item_id': item_id
        }

        return self._make_request(params)

    def get_category_products(self, category_id, page=1):
        """Fetch products from a specific category.

        Args:
            category_id (str): Home Depot category ID
            page (int): Page number to fetch

        Returns:
            dict: Category data from BigBox API
        """
        params = {
            'api_key': self.api_key,
            'type': 'category',
            'category_id': category_id,
            'page': page
        }

        return self._make_request(params)

    def search_products(self, search_term, page=1, sort_by=None):
        """Fetch products using a search term.

        Args:
            search_term (str): Search term to find products
            page (int): Page number to fetch
            sort_by (str, optional): How to sort results (e.g., 'best_seller')

        Returns:
            dict: Search results data from BigBox API
        """
        params = {
            'api_key': self.api_key,
            'type': 'search',
            'search_term': search_term,
            'page': page
        }

        if sort_by:
            params['sort_by'] = sort_by

        return self._make_request(params)

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
            response = self.session.get(self.BASE_URL, params=params)
            response.raise_for_status()

            # Check if we're running low on credits
            result = response.json()
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
