"""
BigBox API Cloud Function
This file provides a Google Cloud Function for the Home Depot Product Data Extractor
"""

import json
import os
import urllib.request
import urllib.parse
import functions_framework
from flask import jsonify

# The API key from environment or default
API_KEY = os.environ.get('BIGBOX_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6')

def get_product_by_url(url):
    """Fetch product data by URL"""
    # Set up the request parameters
    params = {
        'api_key': API_KEY,
        'type': 'product',
        'url': url
    }
    
    query_string = urllib.parse.urlencode(params)
    api_url = f"https://api.bigboxapi.com/request?{query_string}"
    
    try:
        with urllib.request.urlopen(api_url) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except urllib.error.HTTPError as e:
        return {"error": f"API request failed with status code {e.code}"}
    except urllib.error.URLError as e:
        return {"error": f"URL Error: {e.reason}"}
    except json.JSONDecodeError:
        return {"error": "Unable to parse JSON response"}

def get_product_by_id(item_id):
    """Fetch product data by ID"""
    # Set up the request parameters
    params = {
        'api_key': API_KEY,
        'type': 'product',
        'item_id': item_id
    }
    
    query_string = urllib.parse.urlencode(params)
    api_url = f"https://api.bigboxapi.com/request?{query_string}"
    
    try:
        with urllib.request.urlopen(api_url) as response:
            data = response.read().decode('utf-8')
            return json.loads(data)
    except urllib.error.HTTPError as e:
        return {"error": f"API request failed with status code {e.code}"}
    except urllib.error.URLError as e:
        return {"error": f"URL Error: {e.reason}"}
    except json.JSONDecodeError:
        return {"error": "Unable to parse JSON response"}

def get_sample_product():
    """Load sample product data"""
    try:
        with open('sample_product_response.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"error": "Unable to load sample data"}

@functions_framework.http
def get_product(request):
    """HTTP Cloud Function that extracts product data from Home Depot."""
    # Set CORS headers for preflight requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for the main request
    headers = {'Access-Control-Allow-Origin': '*'}

    # Get the URL or ID from the request
    url = request.args.get('url')
    product_id = request.args.get('id')
    
    if url:
        # Try to get live data first
        result = get_product_by_url(url)
        
        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()
            result['_note'] = "Using sample data due to API error."
            
    elif product_id:
        # Try to get live data first
        result = get_product_by_id(product_id)
        
        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()
            result['_note'] = "Using sample data due to API error."
    else:
        return (jsonify({'error': 'No URL or product ID provided'}), 400, headers)

    return (jsonify(result), 200, headers)
