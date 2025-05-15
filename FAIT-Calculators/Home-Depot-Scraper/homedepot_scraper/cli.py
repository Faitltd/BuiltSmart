"""
Command Line Interface for Home Depot Scraper

This module provides a command-line interface for the Home Depot scraper.
"""

import argparse
import logging
import os
import sys
import json
from datetime import datetime

from .scraper import HomeDepotScraper
from .zoho import ZohoBooks
from .utils import load_urls
from config.settings import API_KEY, DEFAULT_DELAY, MAX_PAGES, DEFAULT_FORMAT

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

def parse_args():
    """Parse command line arguments.

    Returns:
        argparse.Namespace: Parsed arguments
    """
    parser = argparse.ArgumentParser(description="Home Depot Building Materials Scraper")

    parser.add_argument('--api-key', default=API_KEY, help='BigBox API key')
    parser.add_argument('--output-dir', default='data', help='Output directory for scraped data')
    parser.add_argument('--format', choices=['json', 'csv'], default=DEFAULT_FORMAT, help='Output format')
    parser.add_argument('--max-pages', type=int, default=MAX_PAGES, help='Maximum number of pages to scrape per category or search term')
    parser.add_argument('--max-products', type=int, help='Maximum number of products to scrape')
    parser.add_argument('--delay', type=float, default=DEFAULT_DELAY, help='Delay between API requests in seconds')
    parser.add_argument('--output-file', help='Custom output filename')
    parser.add_argument('--template', action='store_true', help='Use template format for CSV output')

    # Search options
    search_group = parser.add_argument_group('Search Options')
    search_group.add_argument('--search-terms', nargs='+', help='List of search terms to scrape')
    search_group.add_argument('--search-terms-file', help='Path to a file containing search terms (one per line)')
    search_group.add_argument('--sort-by', choices=['best_seller', 'price_low_to_high', 'price_high_to_low', 'top_rated'],
                        default='best_seller', help='Sort order for search results')

    # URL options
    url_group = parser.add_argument_group('URL Options')
    url_group.add_argument('--url', help='Specific product URL to scrape')
    url_group.add_argument('--urls-file', help='Path to a file containing product URLs (one per line)')

    # Scraping mode
    parser.add_argument('--mode', choices=['categories', 'search', 'url'], default='categories',
                      help='Scraping mode: categories (default), search, or url')

    # Zoho Books integration
    parser.add_argument('--update-zoho', action='store_true', help='Update Zoho Books with scraped data')
    parser.add_argument('--zoho-config', help='Path to Zoho Books configuration file')

    # Debug options
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')
    parser.add_argument('--skip-details', action='store_true', help='Skip fetching detailed product information')

    return parser.parse_args()

def load_zoho_config(config_path):
    """Load Zoho Books configuration from a JSON file.

    Args:
        config_path (str): Path to the configuration file

    Returns:
        dict: Zoho Books configuration
    """
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Failed to load Zoho Books configuration: {str(e)}")
        return None

def load_search_terms(file_path):
    """Load search terms from a file.

    Args:
        file_path (str): Path to the file containing search terms

    Returns:
        list: List of search terms
    """
    try:
        with open(file_path, 'r') as f:
            # Read lines, strip whitespace, and filter out empty lines
            terms = [line.strip() for line in f if line.strip()]
            # Remove quotes if present
            terms = [term.strip('"').strip("'") for term in terms]
            return terms
    except Exception as e:
        logger.error(f"Failed to load search terms from file: {str(e)}")
        return []

def main():
    """Main entry point for the command-line interface."""
    args = parse_args()

    # Set debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("Starting Home Depot Scraper")

    try:
        # Initialize the scraper
        scraper = HomeDepotScraper(
            api_key=args.api_key,
            output_dir=args.output_dir,
            delay=args.delay
        )

        # Determine which mode to use
        if args.mode == 'search':
            # Get search terms
            search_terms = []

            if args.search_terms:
                search_terms.extend(args.search_terms)

            if args.search_terms_file:
                file_terms = load_search_terms(args.search_terms_file)
                search_terms.extend(file_terms)

            if not search_terms:
                logger.error("No search terms provided. Use --search-terms or --search-terms-file")
                return 1

            logger.info(f"Scraping {len(search_terms)} search terms")

            # Scrape search terms
            scraper.scrape_search_terms(
                search_terms=search_terms,
                max_pages_per_term=args.max_pages,
                max_products=args.max_products,
                sort_by=args.sort_by
            )
        elif args.mode == 'url':
            # Get URLs
            urls = []

            if args.url:
                urls.append(args.url)

            if args.urls_file:
                file_urls = load_urls(args.urls_file)
                urls.extend(file_urls)

            if not urls:
                logger.error("No URLs provided. Use --url or --urls-file")
                return 1

            logger.info(f"Scraping {len(urls)} specific URLs")

            # Scrape specific URLs
            scraper.scrape_specific_urls(urls)
        else:  # Default to categories mode
            logger.info("Scraping building materials categories")

            # Scrape all categories
            scraper.scrape_all_categories(
                max_pages_per_category=args.max_pages,
                max_products=args.max_products
            )

        # Fetch detailed product information
        if not args.skip_details:
            scraper.fetch_product_details(max_products=args.max_products)

        # Save results
        if args.template:
            output_file = scraper.save_results_template(output_file=args.output_file)
        else:
            output_file = scraper.save_results(format=args.format, output_file=args.output_file)
        logger.info(f"Saved results to {output_file}")

        # Update Zoho Books if requested
        if args.update_zoho:
            if not args.zoho_config:
                logger.error("Zoho Books configuration file is required for Zoho integration")
                return 1

            zoho_config = load_zoho_config(args.zoho_config)
            if not zoho_config:
                return 1

            zoho = ZohoBooks(
                client_id=zoho_config.get('client_id'),
                client_secret=zoho_config.get('client_secret'),
                organization_id=zoho_config.get('organization_id'),
                refresh_token=zoho_config.get('refresh_token')
            )

            zoho.update_items_from_products(scraper.products)

        logger.info("Scraping completed successfully")
        return 0

    except Exception as e:
        logger.exception(f"Error during scraping: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
