#!/usr/bin/env python3
"""
Test script to verify if the Lowe's API key is valid.
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment
api_key = os.getenv('LOWES_API_KEY')

if not api_key:
    print("Error: No API key found. Please set the LOWES_API_KEY environment variable.")
    exit(1)

print(f"Testing API key: {api_key[:4]}...{api_key[-4:]}")

# Test the API key with a simple request
url = "https://api.bigboxapi.com/request"
params = {
    'api_key': api_key,
    'type': 'category',
    'category_id': '4294857975',  # Appliances category
    'page': 1,
    'source': 'lowes'
}

try:
    response = requests.get(url, params=params)
    response.raise_for_status()  # Raise an exception for 4XX/5XX responses
    
    # Parse the response
    result = response.json()
    
    if 'request_info' in result and result['request_info'].get('success', False):
        print("API key is valid!")
        print(f"Credits remaining: {result['request_info'].get('credits_remaining', 'unknown')}")
        
        # Print some basic info about the response
        if 'category' in result and 'products' in result['category']:
            products = result['category']['products']
            print(f"Found {len(products)} products in the response")
        else:
            print("No products found in the response")
    else:
        print("API key validation failed:")
        print(json.dumps(result, indent=2))
except requests.exceptions.RequestException as e:
    print(f"API request failed: {str(e)}")
    if hasattr(response, 'text'):
        print(f"Response: {response.text}")
