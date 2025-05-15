#!/usr/bin/env python3
"""
Demo script showing how to use the BigBox API client with the specific example
provided in the task instructions.
"""

import json
from bigbox_api_client import BigBoxClient
from bigbox_api_client.utils import extract_product_details

def main():
    # API key from the task
    API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"
    
    # Create the client
    client = BigBoxClient(API_KEY)
    
    # URL from the task
    url = "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"
    
    print(f"Fetching product details from: {url}")
    print("Using API key:", API_KEY)
    print("\nMaking request to BigBox API...\n")
    
    # Make the request
    response = client.get_product_by_url(url)
    
    # Print basic request information
    print(f"Request URL: {response['request_metadata']['homedepot_url']}")
    print(f"Request processing time: {response['request_metadata']['total_time_taken']}s")
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    # Extract and print product summary
    product = extract_product_details(response)
    
    print("\n----- PRODUCT SUMMARY -----")
    print(f"Title: {product['title']}")
    print(f"Brand: {product['brand']}")
    print(f"Model: {product['model_number']}")
    
    # Print price information
    if product['price']:
        price = product['price']
        print(f"Price: {price.get('currency_symbol', '$')}{price.get('current_price', 0)} {price.get('currency', 'USD')}")
    
    # Save the complete response to a file
    with open('product_data.json', 'w') as f:
        json.dump(response, f, indent=2)
    
    print("\nComplete product data saved to product_data.json")
    print("\nTo explore more functionality, try the example scripts in the bigbox_api_client/examples directory")
    print("or use the command-line interface with: python -m bigbox_api_client.cli --help")

if __name__ == "__main__":
    main()
