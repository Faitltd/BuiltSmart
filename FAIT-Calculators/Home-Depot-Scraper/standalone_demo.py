#!/usr/bin/env python3
"""
Standalone demo script that doesn't require any external dependencies.
Uses only Python's built-in libraries to access the BigBox API.
"""

import json
import urllib.request
import urllib.parse
import urllib.error
import sys

def get_product_by_url(api_key, url):
    """Make a request to the BigBox API to get product information by URL."""
    base_url = "https://api.bigboxapi.com/request"
    
    # Prepare parameters
    params = {
        'api_key': api_key,
        'type': 'product',
        'url': url
    }
    
    # Construct the URL with parameters
    query_string = urllib.parse.urlencode(params)
    request_url = f"{base_url}?{query_string}"
    
    print(f"Sending request to: {request_url}")
    
    try:
        # Make the HTTP request
        with urllib.request.urlopen(request_url) as response:
            # Read and parse the response
            response_data = response.read().decode('utf-8')
            data = json.loads(response_data)
            return data
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"URL Error: {e.reason}")
        sys.exit(1)
    except json.JSONDecodeError:
        print("Error: Failed to parse the response as JSON")
        sys.exit(1)

def extract_basic_product_info(response):
    """Extract basic product information from the API response."""
    if 'product' not in response:
        return {}
    
    product = response['product']
    
    # Extract basic product info
    info = {
        'title': product.get('title', ''),
        'brand': product.get('brand', ''),
        'model_number': product.get('model_number', ''),
        'description': product.get('description', '')[:100] + '...' if product.get('description') else '',
        'rating': product.get('rating', 0),
        'ratings_total': product.get('ratings_total', 0)
    }
    
    # Extract price info if available
    if 'buybox_winner' in product:
        buybox = product['buybox_winner']
        info['price'] = {
            'current_price': buybox.get('price', 0),
            'currency': buybox.get('currency', 'USD'),
            'currency_symbol': buybox.get('currency_symbol', '$')
        }
    
    # Extract features if available
    if 'feature_bullets' in product:
        info['features'] = product['feature_bullets']
    
    # Extract main image if available
    if 'main_image' in product and 'link' in product['main_image']:
        info['image_url'] = product['main_image']['link']
    elif 'images' in product and product['images'] and isinstance(product['images'][0], dict):
        info['image_url'] = product['images'][0].get('link', '')
    
    return info

def main():
    """Main function to demonstrate the BigBox API."""
    # API key from the task
    API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"
    
    # URL from the task
    url = "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"
    
    print(f"Fetching product details from: {url}")
    print("Using API key:", API_KEY)
    print("\nMaking request to BigBox API...\n")
    
    # Make the request
    response = get_product_by_url(API_KEY, url)
    
    # Print basic request information
    if 'request_info' in response:
        print(f"Request successful: {response['request_info'].get('success', False)}")
        print(f"Credits used: {response['request_info'].get('credits_used', 0)}")
        print(f"Credits remaining: {response['request_info'].get('credits_remaining', 0)}")
    
    if 'request_metadata' in response:
        print(f"Request URL: {response['request_metadata'].get('homedepot_url', '')}")
        print(f"Request processing time: {response['request_metadata'].get('total_time_taken', 0)}s")
    
    # Extract and print product summary
    product = extract_basic_product_info(response)
    
    if product:
        print("\n----- PRODUCT SUMMARY -----")
        print(f"Title: {product.get('title', 'N/A')}")
        print(f"Brand: {product.get('brand', 'N/A')}")
        print(f"Model: {product.get('model_number', 'N/A')}")
        
        # Print price information
        if 'price' in product:
            price = product['price']
            print(f"Price: {price.get('currency_symbol', '$')}{price.get('current_price', 0)} {price.get('currency', 'USD')}")
        
        # Print features
        if 'features' in product and product['features']:
            print("\nFeatures:")
            for feature in product['features'][:3]:  # Show up to 3 features
                print(f"- {feature}")
    
    # Save the complete response to a file
    with open('product_data.json', 'w') as f:
        json.dump(response, f, indent=2)
    
    print("\nComplete product data saved to product_data.json")

if __name__ == "__main__":
    main()
