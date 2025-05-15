#!/usr/bin/env python3
"""
Test script for search functionality in the Home Depot and Lowe's scrapers.
"""

import os
import sys
import logging
import argparse
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Use DEBUG level for more detailed logs
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('search_test.log', mode='w')
    ]
)

logger = logging.getLogger(__name__)

# Import the scrapers
try:
    from homedepot_scraper.xpath_utils import XPathScraper
    from lowes_scraper.scraper import LowesScraper
except ImportError as e:
    logger.error(f"Failed to import scrapers: {str(e)}")
    logger.error("Make sure you're running this script from the project root directory")
    sys.exit(1)

def test_lowes_search(search_term, max_pages=2, max_products=5):
    """Test Lowe's search functionality."""
    logger.info(f"Testing Lowe's search for: '{search_term}'")
    
    try:
        # Initialize the Lowe's scraper
        api_key = os.environ.get('LOWES_API_KEY')
        if not api_key:
            logger.warning("LOWES_API_KEY environment variable not set")
        
        scraper = LowesScraper(
            api_key=api_key,
            output_dir="test_output",
            max_retries=3,
            delay=1.0
        )
        
        # Try the search
        logger.info(f"Searching for: '{search_term}'")
        product_urls = scraper.scrape_search_term(
            search_term=search_term,
            max_pages=max_pages,
            max_products=max_products
        )
        
        logger.info(f"Found {len(product_urls)} product URLs")
        
        # Log the URLs
        for i, url in enumerate(product_urls):
            logger.info(f"URL {i+1}: {url}")
        
        # Try to fetch details for the first product
        if product_urls:
            logger.info(f"Fetching details for first product: {product_urls[0]}")
            products = scraper.fetch_product_details()
            
            if products:
                logger.info(f"Successfully fetched details for {len(products)} products")
                # Save the first product to a file for inspection
                with open("test_product.json", "w") as f:
                    json.dump(products[0], f, indent=2)
                logger.info(f"Saved first product details to test_product.json")
            else:
                logger.error("Failed to fetch product details")
        
        return product_urls
        
    except Exception as e:
        logger.error(f"Error testing Lowe's search: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

def test_home_depot_search(search_term, max_products=5):
    """Test Home Depot search functionality."""
    logger.info(f"Testing Home Depot search for: '{search_term}'")
    
    try:
        # This is a placeholder - Home Depot search is not directly implemented
        # in the XPathScraper class. You would need to implement this.
        logger.warning("Home Depot search testing not implemented yet")
        return []
        
    except Exception as e:
        logger.error(f"Error testing Home Depot search: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return []

def main():
    """Main function."""
    parser = argparse.ArgumentParser(description="Test search functionality")
    parser.add_argument("search_term", help="Search term to test")
    parser.add_argument("--store", choices=["lowes", "homedepot", "both"], default="both", 
                        help="Which store to test")
    parser.add_argument("--max-pages", type=int, default=2, help="Maximum pages to search")
    parser.add_argument("--max-products", type=int, default=5, help="Maximum products to fetch")
    
    args = parser.parse_args()
    
    lowes_urls = []
    hd_urls = []
    
    if args.store in ["lowes", "both"]:
        lowes_urls = test_lowes_search(args.search_term, args.max_pages, args.max_products)
    
    if args.store in ["homedepot", "both"]:
        hd_urls = test_home_depot_search(args.search_term, args.max_products)
    
    # Summary
    logger.info("=== Search Test Summary ===")
    logger.info(f"Search term: '{args.search_term}'")
    logger.info(f"Lowe's results: {len(lowes_urls)}")
    logger.info(f"Home Depot results: {len(hd_urls)}")
    logger.info(f"Total results: {len(lowes_urls) + len(hd_urls)}")
    
    return 0 if (lowes_urls or hd_urls) else 1

if __name__ == "__main__":
    sys.exit(main())
