import os
import json
import requests
from flask import Blueprint, request, jsonify, render_template
from config.settings import API_KEY

api_routes = Blueprint('api_routes', __name__)

@api_routes.route('/api/diagnostics')
def api_diagnostics():
    """Render the API diagnostics page."""
    return render_template('api_diagnostics.html')

@api_routes.route('/api/test', methods=['POST'])
def test_api():
    """Test the BigBox API connection."""
    # Get form data
    api_key = request.form.get('api_key') or API_KEY
    search_term = request.form.get('search_term', 'pipe')
    update_env = request.form.get('update_env') == 'true'
    
    if not api_key:
        return jsonify({
            'success': False,
            'error': 'API key is required.'
        }), 400

    # Prepare payload for API request
    payload = {
        'api_key': api_key,
        'search_term': search_term,
        'update_env': update_env
    }

    try:
        # Make the API request
        response = requests.post('https://api.bigbox.com/test', json=payload)
        response.raise_for_status()  # Raise an error for bad responses
        data = response.json()

        # Process the response
        if data.get('status') == 'success':
            return jsonify({
                'success': True,
                'data': data
            })
        elif data.get('status') == 'warning':
            return jsonify({
                'success': False,
                'warning': data.get('message'),
                'data': data
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': data.get('message')
            }), 400

    except requests.exceptions.RequestException as e:
        # Handle network errors
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500