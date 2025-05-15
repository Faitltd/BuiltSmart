#!/usr/bin/env python3
"""
Diagnostic tool for the Home Depot and Lowe's scrapers.
This script performs basic tests to identify issues with the scrapers.
"""

import os
import sys
import logging
import requests
import json
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('diagnostic_log.txt', mode='w')
    ]
)

logger = logging.getLogger(__name__)

def check_environment():
    """Check environment variables and dependencies."""
    logger.info("Checking environment...")
    
    # Check Python version
    python_version = sys.version
    logger.info(f"Python version: {python_version}")
    
    # Check for required environment variables
    lowes_api_key = os.environ.get('LOWES_API_KEY')
    if lowes_api_key:
        logger.info(f"LOWES_API_KEY is set (length: {len(lowes_api_key)})")
    else:
        logger.error("LOWES_API_KEY is not set")
    
    # Check for required packages
    try:
        import lxml
        logger.info(f"lxml version: {lxml.__version__}")
    except ImportError:
        logger.error("lxml package is not installed")

def main():
    """Main function."""
    try:
        args = parse_args()
        
        # Check if we have something to scrape
        if not (args.hd_urls or args.lowes_urls or args.lowes_category or args.lowes_search):
            logger.error("No scraping targets specified. Please provide at least one of: --hd-urls, --lowes-urls, --lowes-category, --lowes-search")
            return 1
        
        # Initialize the combined scraper
        scraper = CombinedScraper(
            output_dir=args.output_dir,
            max_retries=args.max_retries,
            min_delay=args.min_delay,
            max_delay=args.max_delay
        )
        
        # Track if any scraping was successful
        success = False
        
        # Scrape Home Depot if URLs are provided
        if args.hd_urls:
            hd_results = scraper.scrape_home_depot(urls=args.hd_urls, max_products=args.max_products)
            if hd_results:
                success = True
                logger.info(f"Successfully scraped {len(hd_results)} Home Depot products")
            else:
                logger.warning("Home Depot scraping returned no results")
        
        # Scrape Lowe's if URLs, category, or search term is provided
        if args.lowes_urls:
            lowes_results = scraper.scrape_lowes(urls=args.lowes_urls, max_pages=args.max_pages, max_products=args.max_products)
            if lowes_results:
                success = True
                logger.info(f"Successfully scraped {len(lowes_results)} Lowe's products")
            else:
                logger.warning("Lowe's scraping returned no results")
        elif args.lowes_category:
            lowes_results = scraper.scrape_lowes(category_id=args.lowes_category, max_pages=args.max_pages, max_products=args.max_products)
            if lowes_results:
                success = True
                logger.info(f"Successfully scraped {len(lowes_results)} Lowe's products from category")
            else:
                logger.warning("Lowe's category scraping returned no results")
        elif args.lowes_search:
            lowes_results = scraper.scrape_lowes(search_term=args.lowes_search, max_pages=args.max_pages, max_products=args.max_products)
            if lowes_results:
                success = True
                logger.info(f"Successfully scraped {len(lowes_results)} Lowe's products from search")
            else:
                logger.warning("Lowe's search scraping returned no results")
        
        # Save results
        output_files = scraper.save_results(format=args.format, prefix=args.prefix)
        if output_files:
            logger.info(f"Results saved successfully: {output_files}")
            success = True
        else:
            logger.warning("No results were saved")
        
        # Return appropriate exit code
        return 0 if success else 1
        
    except KeyboardInterrupt:
        logger.info("Scraping interrupted by user")
        return 130  # Standard exit code for SIGINT
    except Exception as e:
        logger.critical(f"Unhandled exception: {str(e)}")
        logger.critical(traceback.format_exc())
        return 1

if __name__ == "__main__":
    exit_code = main()
    
    # If the scraper failed with a non-zero exit code, we might want to restart it
    if exit_code != 0:
        logger.warning(f"Scraper exited with code {exit_code}. Checking if restart is needed...")
        
        # Check if environment variable is set to enable auto-restart
        if os.environ.get('SCRAPER_AUTO_RESTART', '').lower() == 'true':
            restart_delay = int(os.environ.get('SCRAPER_RESTART_DELAY', '60'))
            max_restarts = int(os.environ.get('SCRAPER_MAX_RESTARTS', '3'))
            
            # Check if we've already restarted too many times
            restart_count = int(os.environ.get('SCRAPER_RESTART_COUNT', '0'))
            if restart_count < max_restarts:
                logger.info(f"Auto-restart enabled. Restarting in {restart_delay} seconds (attempt {restart_count + 1}/{max_restarts})...")
                
                # Set the restart count for the next run
                os.environ['SCRAPER_RESTART_COUNT'] = str(restart_count + 1)
                
                # Wait before restarting
                time.sleep(restart_delay)
                
                # Re-execute the script with the same arguments
                logger.info("Restarting scraper...")
                os.execv(sys.executable, [sys.executable] + sys.argv)
            else:
                logger.error(f"Maximum restart attempts ({max_restarts}) reached. Giving up.")
        else:
            logger.info("Auto-restart not enabled. Set SCRAPER_AUTO_RESTART=true to enable.")
    
    # Reset restart count on successful run
    if exit_code == 0 and os.environ.get('SCRAPER_RESTART_COUNT'):
        os.environ['SCRAPER_RESTART_COUNT'] = '0'
    
    sys.exit(exit_code)