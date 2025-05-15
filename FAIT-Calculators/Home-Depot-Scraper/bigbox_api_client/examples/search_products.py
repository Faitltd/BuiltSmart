#!/usr/bin/env python3
"""
Example script demonstrating how to search for products on Home Depot
using the BigBox API client.
"""

import json
import sys
import os
import argparse

# Add the parent directory to the path so we can import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from bigbox_api_client import BigBoxClient
from bigbox_api_client.utils import extract_search_products, get_pagination_info


def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Search for products on Home Depot')
    parser.add_argument('search_term', help='Term to search for')
    parser.add_argument('--sort', choices=['best_seller', 'price_low_to_high', 'price_high_to_low', 'top_rated'], 
                        default='best_seller', help='Sort order')
    parser.add_argument('--zipcode', help='Customer zip code for localized results')
    parser.add_argument('--page', type=int, default=1, help='Page number')
    parser.add_argument('--api-key', default='52323740B6D14CBE81D81C81E0DD32E6', 
                        help='BigBox API key (default: uses example key)')
    args = parser.parse_args()
    
    # Create the client
    client = BigBoxClient(args.api_key)
    
    print(f"Searching for: {args.search_term}")
    print(f"Sort by: {args.sort}")
    if args.zipcode:
        print(f"Localized to zip code: {args.zipcode}")
    print(f"Page: {args.page}")
    
    try:
        # Make the search request
        response = client.search(
            search_term=args.search_term,
            sort_by=args.sort,
            customer_zipcode=args.zipcode,
            page=args.page
        )
        
        # Print credits information
        print(f"\nCredits used: {response['request_info']['credits_used']}")
        print(f"Credits remaining: {response['request_info']['credits_remaining']}")
        
        # Extract pagination information
        pagination = get_pagination_info(response)
        if pagination:
            print(f"\nShowing page {pagination['current_page']} of {pagination['total_pages']}")
            print(f"Total results: {pagination['total_results']}")
        
        # Extract products from search results
        products = extract_search_products(response)
        
        # Print product information
        print(f"\nFound {len(products)} products on this page:\n")
        
        for i, product in enumerate(products, 1):
            print(f"{i}. {product['title']}")
            print(f"   Brand: {product['brand']}")
            
            # Print price if available
            if 'price' in product and 'current_price' in product['price']:
                price_info = product['price']
                price_str = f"{price_info.get('currency_symbol', '$')}{price_info.get('current_price', 0)}"
                
                # Add sale information if available
                if price_info.get('is_on_sale', False):
                    reg_price = f"{price_info.get('currency_symbol', '$')}{price_info.get('regular_price', 0)}"
                    price_str = f"{price_str} (was {reg_price})"
                
                print(f"   Price: {price_str}")
            
            # Print rating if available
            if product['rating'] > 0:
                print(f"   Rating: {product['rating']} stars ({product['ratings_total']} reviews)")
            
            # Print item ID and link
            print(f"   Item ID: {product['item_id']}")
            print(f"   Link: {product['link']}")
            
            # Print a feature or two if available
            if 'features' in product and product['features']:
                print(f"   Features: {product['features'][0]}")
                if len(product['features']) > 1:
                    print(f"             {product['features'][1]}")
            
            print()  # Add space between products
        
        # Print next page information if available
        if pagination and 'next_page' in pagination:
            print(f"For next page, run with --page {pagination['next_page']}")
        
        # Save the full response to a file
        filename = f"search_{args.search_term.replace(' ', '_')}_page{args.page}.json"
        with open(filename, 'w') as f:
            json.dump(response, f, indent=2)
            print(f"\nFull response saved to {filename}")
        
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
