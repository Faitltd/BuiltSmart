#!/usr/bin/env python3
"""
Example script demonstrating how to retrieve product details from Home Depot
using the BigBox API client.
"""

import json
import sys
import os

# Add the parent directory to the path so we can import the module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from bigbox_api_client import BigBoxClient
from bigbox_api_client.utils import extract_product_details


def main():
    # Your API key - replace with your actual API key
    API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"
    
    # Create the client
    client = BigBoxClient(API_KEY)
    
    # Example product URL
    product_url = "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"
    
    print(f"Fetching product details for: {product_url}")
    
    try:
        # Get the raw API response
        response = client.get_product_by_url(product_url)
        
        # Print credits information
        print(f"Credits used: {response['request_info']['credits_used']}")
        print(f"Credits remaining: {response['request_info']['credits_remaining']}")
        
        # Extract simplified product details
        product = extract_product_details(response)
        
        # Print basic product information
        print("\nProduct Information:")
        print(f"Title: {product['title']}")
        print(f"Brand: {product['brand']}")
        print(f"Model: {product['model_number']}")
        print(f"Rating: {product['rating']} ({product['ratings_total']} reviews)")
        
        # Print price information
        if product['price']:
            price_info = product['price']
            print(f"\nPrice: {price_info.get('currency_symbol', '$')}{price_info.get('current_price', 0)}")
            
            if price_info.get('is_on_sale', False):
                print(f"Regular price: {price_info.get('currency_symbol', '$')}{price_info.get('regular_price', 0)}")
                print(f"You save: {price_info.get('currency_symbol', '$')}{price_info.get('savings', 0)} "
                      f"({price_info.get('savings_percent', 0)}%)")
        
        # Print availability information
        if product['availability']:
            avail = product['availability']
            print("\nAvailability:")
            print(f"Available for pickup: {'Yes' if avail.get('available_for_pickup', False) else 'No'}")
            print(f"Available for shipping: {'Yes' if avail.get('available_for_shipping', False) else 'No'}")
            print(f"Available for delivery: {'Yes' if avail.get('available_for_delivery', False) else 'No'}")
        
        # Print features
        if product['features']:
            print("\nFeatures:")
            for feature in product['features']:
                print(f"- {feature}")
        
        # Print a sample of specifications
        if product['specifications']:
            print("\nSpecifications Sample:")
            for group_name, specs in list(product['specifications'].items())[:3]:  # Print up to 3 groups
                print(f"\n{group_name}:")
                for name, value in list(specs.items())[:5]:  # Print up to 5 specs per group
                    print(f"  {name}: {value}")
        
        # Save the full response to a file
        with open('product_response.json', 'w') as f:
            json.dump(response, f, indent=2)
            print(f"\nFull response saved to product_response.json")
        
        # Save the extracted product details to a file
        with open('product_details.json', 'w') as f:
            json.dump(product, f, indent=2)
            print(f"Extracted product details saved to product_details.json")
            
    except Exception as e:
        print(f"Error: {str(e)}")


if __name__ == "__main__":
    main()
