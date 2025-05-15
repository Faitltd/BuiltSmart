"""
Cloud Execution Module for Home Depot Scraper

This module provides functionality for running the scraper in a cloud environment
with scheduled execution.
"""

import os
import logging
import json
import time
from datetime import datetime
import argparse
import sys

from .scraper import HomeDepotScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"homedepot_scraper_{datetime.now().strftime('%Y-%m-%d')}.log")
    ]
)

logger = logging.getLogger(__name__)

def run_scraper():
    """Run the scraper with environment variables or defaults."""
    # Get configuration from environment variables
    api_key = os.environ.get('BIGBOX_API_KEY')
    output_dir = os.environ.get('OUTPUT_DIR', 'data')
    max_pages = os.environ.get('MAX_PAGES')
    max_products = os.environ.get('MAX_PRODUCTS')
    delay = float(os.environ.get('REQUEST_DELAY', '1.0'))
    
    if not api_key:
        logger.error("BIGBOX_API_KEY environment variable is required")
        return 1
    
    # Convert string values to integers if provided
    if max_pages:
        try:
            max_pages = int(max_pages)
        except ValueError:
            logger.warning(f"Invalid MAX_PAGES value: {max_pages}. Using default.")
            max_pages = None
    
    if max_products:
        try:
            max_products = int(max_products)
        except ValueError:
            logger.warning(f"Invalid MAX_PRODUCTS value: {max_products}. Using default.")
            max_products = None
    
    logger.info("Starting Home Depot Building Materials Scraper in cloud mode")
    logger.info(f"API Key: {'*' * 8}{api_key[-4:] if api_key else 'Not provided'}")
    logger.info(f"Output Directory: {output_dir}")
    logger.info(f"Max Pages: {max_pages or 'All'}")
    logger.info(f"Max Products: {max_products or 'All'}")
    logger.info(f"Request Delay: {delay} seconds")
    
    try:
        # Initialize the scraper
        scraper = HomeDepotScraper(
            api_key=api_key,
            output_dir=output_dir,
            delay=delay
        )
        
        # Scrape all categories
        start_time = time.time()
        scraper.scrape_all_categories(
            max_pages_per_category=max_pages,
            max_products=max_products
        )
        
        # Fetch detailed product information
        scraper.fetch_product_details(max_products=max_products)
        
        # Save results in both formats
        csv_file = scraper.save_results(format='csv')
        json_file = scraper.save_results(format='json')
        
        # Log completion
        elapsed_time = time.time() - start_time
        logger.info(f"Scraping completed in {elapsed_time:.2f} seconds")
        logger.info(f"Scraped {len(scraper.products)} products")
        logger.info(f"Results saved to:")
        logger.info(f"  CSV: {csv_file}")
        logger.info(f"  JSON: {json_file}")
        
        return 0
        
    except Exception as e:
        logger.exception(f"Error during scraping: {str(e)}")
        return 1

def main():
    """Main entry point for cloud execution."""
    parser = argparse.ArgumentParser(description="Home Depot Building Materials Scraper (Cloud Mode)")
    parser.add_argument('--run-now', action='store_true', help='Run the scraper immediately')
    args = parser.parse_args()
    
    if args.run_now:
        # Run the scraper immediately
        return run_scraper()
    else:
        # This would be called by the cloud scheduler
        return run_scraper()

if __name__ == "__main__":
    sys.exit(main())
