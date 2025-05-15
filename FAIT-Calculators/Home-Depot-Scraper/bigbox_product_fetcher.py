#!/usr/bin/env python3
"""
BigBox API Client for Home Depot Product Data
This script fetches product data from Home Depot using the BigBox API.
"""

import argparse
import json
import os
import re
import requests
import time
from urllib.parse import urlparse, parse_qs, quote

class BigBoxClient:
    """Client for interacting with the BigBox API to fetch Home Depot product data."""
    
    BASE_URL = "https://api.bigboxapi.com/request"
    
    def __init__(self, api_key):
        """Initialize the BigBox API client.
        
        Args:
            api_key (str): Your BigBox API key
        """
        self.api_key = api_key
        self.session = requests.Session()
    
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
            'url': url
        }
        
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
            response = self.session.get(self.BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {str(e)}")
            if response.text:
                print(f"Response: {response.text}")
            raise

def process_input(input_data, api_key, output_file=None, delay=1):
    """Process a list of URLs or product IDs and fetch data for each.
    
    Args:
        input_data (list): List of URLs or product IDs
        api_key (str): BigBox API key
        output_file (str, optional): Path to save JSON output
        delay (int, optional): Delay between API requests in seconds
        
    Returns:
        list: List of product data dictionaries
    """
    client = BigBoxClient(api_key)
    results = []
    
    for item in input_data:
        item = item.strip()
        if not item:
            continue
            
        print(f"Processing: {item}")
        
        try:
            # Determine if this is a URL or product ID
            if item.startswith('http'):
                result = client.get_product_by_url(item)
            else:
                result = client.get_product_by_id(item)
                
            results.append(result)
            
            # Print basic info about the fetched product
            if result.get('product'):
                product = result['product']
                print(f"Retrieved: {product.get('title', 'Unknown product')}")
                print(f"Price: {product.get('buybox_winner', {}).get('price', 'N/A')}")
                print(f"Rating: {product.get('rating', 'N/A')}")
            else:
                print("No product data returned")
                
            # Check API credits
            if 'request_info' in result:
                info = result['request_info']
                print(f"Credits used: {info.get('credits_used', 'Unknown')}")
                print(f"Credits remaining: {info.get('credits_remaining', 'Unknown')}")
                
        except Exception as e:
            print(f"Error processing {item}: {str(e)}")
        
        # Sleep to avoid hitting rate limits
        if delay > 0:
            time.sleep(delay)
    
    # Save results if an output file was specified
    if output_file and results:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        print(f"Results saved to {output_file}")
    
    return results

def load_input_file(file_path):
    """Load URLs or product IDs from a file.
    
    Args:
        file_path (str): Path to the input file
        
    Returns:
        list: List of URLs or product IDs
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip()]
    except Exception as e:
        print(f"Error loading input file: {str(e)}")
        return []

def main():
    """Main entry point for command-line usage."""
    parser = argparse.ArgumentParser(description="Fetch Home Depot product data using BigBox API")
    
    # API key can be provided via command line or environment variable
    parser.add_argument('--api-key', 
                        default=os.environ.get('BIGBOX_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6'),
                        help="BigBox API key (default: environment variable BIGBOX_API_KEY)")
    
    # Input sources
    input_group = parser.add_mutually_exclusive_group(required=True)
    input_group.add_argument('--url', help="Home Depot product URL")
    input_group.add_argument('--id', help="Home Depot product ID")
    input_group.add_argument('--file', help="File containing Home Depot URLs or product IDs (one per line)")
    
    # Output options
    parser.add_argument('--output', help="Output JSON file path")
    parser.add_argument('--delay', type=int, default=1, help="Delay between API requests in seconds (default: 1)")
    
    args = parser.parse_args()
    
    # Determine the input source
    input_data = []
    if args.url:
        input_data = [args.url]
    elif args.id:
        input_data = [args.id]
    elif args.file:
        input_data = load_input_file(args.file)
    
    if not input_data:
        print("No input data provided")
        return
    
    # Process the input data
    results = process_input(input_data, args.api_key, args.output, args.delay)
    
    # Print summary
    print(f"Processed {len(results)} items")

if __name__ == "__main__":
    main()
