#!/usr/bin/env python3
"""
Extract form groups from Home Depot product pages using XPath.

This script demonstrates how to use the XPath selector to extract form-group elements
from Home Depot product pages.
"""

import argparse
import json
import logging
import sys
from homedepot_scraper.xpath_utils import extract_form_groups_from_url, scrape_product_page

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Extract form groups from Home Depot product pages")
    parser.add_argument('url', help='URL of the Home Depot product page')
    parser.add_argument('--output', '-o', help='Output file (JSON format)')
    parser.add_argument('--user-agent', '-u', help='Custom user agent string')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    parser.add_argument('--product-data', '-p', action='store_true', help='Extract full product data')
    return parser.parse_args()

def main():
    """Main entry point for the script."""
    args = parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        logger.info(f"Extracting data from URL: {args.url}")
        
        if args.product_data:
            # Extract full product data
            data = scrape_product_page(args.url, args.user_agent)
            logger.info(f"Extracted product data with {len(data.get('form_data', {}))} form fields")
        else:
            # Extract only form groups
            data = extract_form_groups_from_url(args.url, args.user_agent)
            logger.info(f"Extracted {len(data)} form groups")
        
        # Output the data
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(data, f, indent=2)
            logger.info(f"Data saved to {args.output}")
        else:
            # Print to stdout
            print(json.dumps(data, indent=2))
        
        return 0
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
