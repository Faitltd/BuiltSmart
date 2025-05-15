#!/usr/bin/env python3
"""
Test script for the Home Depot Scraper

This script tests the basic functionality of the Home Depot scraper.
"""

import os
import sys
import logging
import argparse
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Main entry point for the test script."""
    # Load environment variables from .env file if it exists
    load_dotenv()
    
    parser = argparse.ArgumentParser(description="Test the Home Depot Scraper")
    parser.add_argument('--api-key', default=os.environ.get('BIGBOX_API_KEY'), help='BigBox API key')
    parser.add_argument('--test-mode', choices=['basic', 'full'], default='basic', help='Test mode')
    args = parser.parse_args()
    
    if not args.api_key:
        logger.error("API key is required. Set it with --api-key or in the .env file.")
        return 1
    
    try:
        # Import the scraper module
        from homedepot_scraper.scraper import HomeDepotScraper
        
        # Create a test directory
        os.makedirs('test_data', exist_ok=True)
        
        # Initialize the scraper
        scraper = HomeDepotScraper(
            api_key=args.api_key,
            output_dir='test_data',
            delay=1
        )
        
        if args.test_mode == 'basic':
            # Test with a single category and limited pages
            logger.info("Running basic test with a single category")
            
            # Get the first category
            category_name = "Lumber & Composites"
            category_id = scraper.CATEGORY_IDS[category_name]
            
            # Scrape just one page
            logger.info(f"Scraping category: {category_name}")
            urls = scraper.scrape_category(category_id, category_name, max_pages=1)
            
            # Fetch details for a few products
            if urls:
                logger.info(f"Found {len(urls)} products. Fetching details for 3 products.")
                scraper.fetch_product_details(max_products=3)
                
                # Save results
                csv_file = scraper.save_results(format='csv')
                json_file = scraper.save_results(format='json')
                
                logger.info(f"Results saved to:")
                logger.info(f"  CSV: {csv_file}")
                logger.info(f"  JSON: {json_file}")
            else:
                logger.error("No products found in the category.")
                return 1
                
        else:  # full test
            # Test with all categories but limited pages
            logger.info("Running full test with all categories")
            
            # Scrape all categories with limited pages
            scraper.scrape_all_categories(max_pages_per_category=1, max_products=10)
            
            # Fetch details
            scraper.fetch_product_details(max_products=10)
            
            # Save results
            csv_file = scraper.save_results(format='csv')
            json_file = scraper.save_results(format='json')
            
            logger.info(f"Results saved to:")
            logger.info(f"  CSV: {csv_file}")
            logger.info(f"  JSON: {json_file}")
        
        logger.info("Test completed successfully")
        return 0
        
    except ImportError:
        logger.error("Failed to import the scraper module. Make sure the package is installed.")
        return 1
    except Exception as e:
        logger.exception(f"Test failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
