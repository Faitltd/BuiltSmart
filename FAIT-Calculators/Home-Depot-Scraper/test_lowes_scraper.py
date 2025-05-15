#!/usr/bin/env python3
"""
Test script for the Lowe's scraper.
"""

import os
import logging
from dotenv import load_dotenv
from lowes_scraper.scraper import LowesScraper

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

logger.info(f"Initializing Lowe's scraper with API key: {api_key[:4]}...{api_key[-4:]}")

# Initialize the scraper
scraper = LowesScraper(api_key=api_key, output_dir="data/lowes")

# Test search term scrape
search_term = "refrigerator"
max_pages = 2
max_products = 5

logger.info(f"Starting search term scrape for: {search_term}")
logger.info(f"Max pages: {max_pages}, Max products: {max_products}")

# Scrape search term
product_urls = scraper.scrape_search_term(
    search_term=search_term,
    max_pages=max_pages,
    max_products=max_products
)

logger.info(f"Found {len(product_urls)} product URLs")

# Fetch product details
logger.info("Fetching product details...")
products = scraper.fetch_product_details()

logger.info(f"Fetched details for {len(products)} products")

# Save results
output_file = scraper.save_results(format="csv")
logger.info(f"Results saved to {output_file}")

logger.info("Test completed successfully")
