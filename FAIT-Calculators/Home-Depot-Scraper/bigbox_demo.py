#!/usr/bin/env python3
"""
BigBox API Demo
This script demonstrates how to use the BigBox API to fetch Home Depot product data.
"""

import json
import requests
import sys
from urllib.parse import quote

# The API key provided in the task
API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"

def fetch_product_by_url(url):
    """
    Fetch product details for a Home Depot product URL using BigBox API.
    
    Args:
        url (str): Home Depot product URL
        
    Returns:
        dict: Product data from BigBox API
    """
    # Set up the request parameters
    params = {
        'api_key': API_KEY,
        'type': 'product',
        'url': url
    }
    
    # Make the HTTP GET request to BigBox API
    response = requests.get('https://api.bigboxapi.com/request', params=params)
    
    # Check if the request was successful
    if response.status_code != 200:
        print(f"Error: API request failed with status code {response.status_code}")
        print(f"Response: {response.text}")
        sys.exit(1)
    
    # Return the JSON response
    return response.json()

def main():
    # Use the URL from the sample file or a default one
    try:
        with open('sample_homedepot_urls.txt', 'r') as f:
            url = f.readline().strip()
    except:
        # Use the URL from the original task if sample file is not available
        url = "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"
    
    print(f"Fetching data for: {url}")
    
    # Make the API request
    result = fetch_product_by_url(url)
    
    # Save the full result to a JSON file
    with open('product_data.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2)
    
    print(f"Full data saved to product_data.json")
    
    # Extract and print some key information from the result
    if 'product' in result:
        product = result['product']
        print("\nProduct Information:")
        print(f"Title: {product.get('title', 'N/A')}")
        print(f"Brand: {product.get('brand', 'N/A')}")
        print(f"Model: {product.get('model_number', 'N/A')}")
        
        # Get the price from the buybox_winner
        if 'buybox_winner' in product:
            price_info = product['buybox_winner']
            price = price_info.get('price', 'N/A')
            currency = price_info.get('currency_symbol', '$')
            print(f"Price: {currency}{price}")
        
        print(f"Rating: {product.get('rating', 'N/A')} ({product.get('ratings_total', 0)} reviews)")
        
        # Print some specifications
        if 'specifications' in product:
            print("\nSpecifications:")
            for spec in product['specifications'][:10]:  # Just print the first 10 specs
                print(f"- {spec.get('name', 'N/A')}: {spec.get('value', 'N/A')}")
    else:
        print("No product data found in the response.")
    
    # Print API usage information
    if 'request_info' in result:
        info = result['request_info']
        print("\nAPI Usage:")
        print(f"Credits used: {info.get('credits_used', 'Unknown')}")
        print(f"Credits remaining: {info.get('credits_remaining', 'Unknown')}")

if __name__ == "__main__":
    main()
