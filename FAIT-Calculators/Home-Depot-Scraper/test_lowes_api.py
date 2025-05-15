#!/usr/bin/env python3
"""
Test script to verify if the Lowe's API key is working correctly with Backyard API.
"""

import os
import json
import logging
from dotenv import load_dotenv
from lowes_scraper.api import LowesClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
api_key = os.getenv('LOWES_API_KEY')

if not api_key:
    logger.error("Error: No API key found. Please set the LOWES_API_KEY environment variable.")
    exit(1)

logger.info(f"Testing Backyard API key for Lowe's: {api_key[:4]}...{api_key[-4:]}")

# Initialize the Lowe's client
client = LowesClient(api_key=api_key)

# Test with a search request (instead of category)
search_term = "refrigerator"
logger.info(f"Testing search request for term: {search_term}")

try:
    # Make the request
    category_data = client.search_products(search_term, page=1)

    # Check if the request was successful
    if 'request_info' in category_data and category_data['request_info'].get('success', False):
        logger.info("Search request successful!")

        # Print credits information
        credits_remaining = category_data['request_info'].get('credits_remaining', 'unknown')
        logger.info(f"Credits remaining: {credits_remaining}")

        # Print the structure of the response
        logger.info(f"Response keys: {list(category_data.keys())}")
        if 'search' in category_data:
            logger.info(f"Search keys: {list(category_data['search'].keys())}")

        # Print some basic info about the response
        if 'search_results' in category_data:
            products = category_data['search_results']
            logger.info(f"Found {len(products)} products in the search results")

            # Print the first product
            if products:
                logger.info(f"First product keys: {list(products[0].keys())}")

                # Check if there's a product field
                if 'product' in products[0]:
                    product = products[0]['product']
                    logger.info(f"Product field keys: {list(product.keys())}")
                    logger.info(f"Product title: {product.get('title', 'No title')}")
                    logger.info(f"Product item_id: {product.get('item_id', 'No item_id')}")
                else:
                    logger.warning("No product field in search result")
        else:
            logger.warning("No products found in the search response")
    else:
        error_msg = category_data.get('request_info', {}).get('message', 'Unknown error')
        logger.error(f"Category request failed: {error_msg}")
except Exception as e:
    logger.error(f"Error making category request: {str(e)}")

# Test with a product URL
test_url = "https://www.lowes.com/pd/GE-Profile-UltraFresh-Vent-System-with-OdorBlock-5-cu-ft-Capacity-Smart-Front-Load-ENERGY-STAR-Washer-with-Sanitize-Cycle-Carbon-Graphite/5013251939"
logger.info(f"Testing product request for URL: {test_url}")

try:
    # Make the request
    product_data = client.get_product_by_url(test_url)

    # Check if the request was successful
    if 'request_info' in product_data and product_data['request_info'].get('success', False):
        logger.info("Product request successful!")

        # Print credits information
        credits_remaining = product_data['request_info'].get('credits_remaining', 'unknown')
        logger.info(f"Credits remaining: {credits_remaining}")

        # Print some basic info about the response
        if 'product' in product_data:
            product = product_data['product']
            logger.info(f"Product title: {product.get('title', 'No title')}")
            logger.info(f"Product brand: {product.get('brand', 'No brand')}")

            # Print price information
            if 'buybox_winner' in product and 'price' in product['buybox_winner']:
                logger.info(f"Product price: {product['buybox_winner']['price']}")
        else:
            logger.warning("No product data found in the response")
    else:
        error_msg = product_data.get('request_info', {}).get('message', 'Unknown error')
        logger.error(f"Product request failed: {error_msg}")
except Exception as e:
    logger.error(f"Error making product request: {str(e)}")

logger.info("API testing completed")
