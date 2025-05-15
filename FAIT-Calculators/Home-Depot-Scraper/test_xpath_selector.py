#!/usr/bin/env python3
"""
Test script for the XPath selector.

This script demonstrates how to use the XPath selector to extract form-group elements
from a Home Depot product page and display the results in a more user-friendly format.
"""

import argparse
import logging
import sys
from tabulate import tabulate
from homedepot_scraper.xpath_utils import extract_form_groups_from_url

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Test XPath selector for form-group elements")
    parser.add_argument('url', help='URL of the Home Depot product page')
    parser.add_argument('--user-agent', '-u', help='Custom user agent string')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose output')
    return parser.parse_args()

def main():
    """Main entry point for the script."""
    args = parse_args()
    
    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        logger.info(f"Extracting form groups from URL: {args.url}")
        
        # Extract form groups
        form_groups = extract_form_groups_from_url(args.url, args.user_agent)
        logger.info(f"Extracted {len(form_groups)} form groups")
        
        # Prepare data for tabular display
        table_data = []
        for i, form_group in enumerate(form_groups, 1):
            label = form_group.get('label', 'N/A')
            element_type = form_group.get('element_type', 'N/A')
            element_id = form_group.get('element_id', 'N/A')
            element_name = form_group.get('element_name', 'N/A')
            
            # Get value based on element type
            if element_type == 'select':
                options = form_group.get('options', [])
                selected_options = [opt['text'] for opt in options if opt.get('selected')]
                value = ', '.join(selected_options) if selected_options else 'None selected'
            else:
                value = form_group.get('value', 'N/A')
            
            table_data.append([i, label, element_type, element_id, element_name, value])
        
        # Display the results in a table
        headers = ['#', 'Label', 'Type', 'ID', 'Name', 'Value']
        print("\nForm Groups Found:")
        print(tabulate(table_data, headers=headers, tablefmt='grid'))
        
        return 0
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
