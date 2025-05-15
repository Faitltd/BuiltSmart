import os
import json
import requests
from flask import request, jsonify

def handle_api_test():
    """Test the BigBox API connection and return diagnostic information."""
    # Get API key and search term from request
    data = request.get_json()
    api_key = data.get('api_key', '')
    search_term = data.get('search_term', 'pipe')
    
    # Validate inputs
    if not api_key:
        return jsonify({
            'success': False,
            'message': 'API key is required'
        }), 400
    
    # Test API connection
    try:
        # Make a request to the BigBox API
        response = requests.get(
            f"https://api.bigboxapi.com/request?api_key={api_key}&search_term={search_term}&type=search&page=1",
            timeout=10
        )
        
        # Parse response
        status_code = response.status_code
        response_json = response.json() if response.status_code == 200 else {}
        
        # Check if API request was successful
        api_success = status_code == 200 and response_json.get('status') == 'success'
        
        # Get sample product if available
        sample_product = None
        if api_success and 'data' in response_json and 'results' in response_json['data']:
            results = response_json['data']['results']
            if results and len(results) > 0:
                sample_product = results[0]
        
        # Get credits information if available
        credits_remaining = response_json.get('credits_remaining', 0) if api_success else 0
        
        # Return diagnostic information
        return jsonify({
            'success': True,
            'status_code': status_code,
            'api_success': api_success,
            'message': 'API connection successful' if api_success else 'API connection failed',
            'credits_remaining': credits_remaining,
            'sample_product': sample_product,
            'raw_response': json.dumps(response_json, indent=2)
        })
        
    except requests.exceptions.RequestException as e:
        # Handle connection errors
        return jsonify({
            'success': False,
            'message': f'Connection error: {str(e)}'
        }), 500
    except Exception as e:
        # Handle other errors
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500