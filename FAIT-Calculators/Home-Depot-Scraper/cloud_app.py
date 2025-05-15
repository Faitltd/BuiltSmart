#!/usr/bin/env python3
"""
Home Depot Scraper Web Application - Cloud Version

This Flask application provides a web interface for the Home Depot scraper,
optimized for cloud deployment.
"""

import json
import os
import time
import threading
import logging
import csv
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime
from flask import Flask, render_template, render_template_string, request, jsonify, send_file, redirect, url_for

# Try to import requests
try:
    import requests
    has_requests = True
except ImportError:
    has_requests = False

# Import scraper components
from homedepot_scraper.scraper import HomeDepotScraper
from config.settings import API_KEY, RAW_DATA_DIR, RESULTS_DIR, CSV_TEMPLATE

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Global variables
scraper_jobs = {}
next_job_id = 1
thread_local = threading.local()

# Ensure directories exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)

# HTML template for the home page
HOME_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Home Depot Product Data Extractor</title>
    <style>
        /* Import 8-bit font */
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        body {
            font-family: 'Press Start 2P', cursive;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            background-color: #000;
            color: #fff;
            image-rendering: pixelated;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQImWNgYGD4z0AswK4SAFXuAf8EPy+xAAAAAElFTkSuQmCC');
            background-repeat: repeat;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            border: 4px solid #f96302; /* Home Depot Orange */
            box-shadow: 8px 8px 0 rgba(249, 99, 2, 0.3);
        }
        h1 {
            color: #f96302; /* Home Depot Orange */
            text-transform: uppercase;
            text-shadow: 2px 2px 0 #000;
            font-size: 1.5rem;
        }
        form {
            margin: 20px 0;
            padding: 15px;
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
        }
        label {
            display: block;
            margin-bottom: 10px;
            font-weight: bold;
            color: #f96302; /* Home Depot Orange */
            font-size: 0.8rem;
            text-transform: uppercase;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            margin-bottom: 15px;
            border: 3px solid #f96302; /* Home Depot Orange */
            background-color: #000;
            color: #fff;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7rem;
            box-sizing: border-box;
        }
        button {
            background-color: #f96302; /* Home Depot Orange */
            color: #fff;
            border: 4px solid #000;
            padding: 10px 20px;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            text-transform: uppercase;
            font-size: 0.8rem;
            box-shadow: 4px 4px 0 #000;
            transition: all 0.1s ease;
        }
        button:hover {
            background-color: #ff8533; /* Lighter orange */
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #000;
        }
        .info {
            margin: 20px 0;
            padding: 15px;
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
            font-size: 0.7rem;
        }
        .example {
            background-color: #000;
            padding: 15px;
            border: 4px solid #f96302; /* Home Depot Orange */
            overflow-x: auto;
            margin-top: 20px;
        }
        pre {
            white-space: pre-wrap;
            margin: 0;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7rem;
            color: #f96302; /* Home Depot Orange */
        }
        code {
            background-color: #f96302; /* Home Depot Orange */
            color: #000;
            padding: 2px 5px;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.7rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Home Depot Product Data Extractor</h1>

        <div class="info">
            <p>This application extracts product data from Home Depot using the BigBox API.</p>
            <p><strong>API Status:</strong> {{ api_status }}</p>
        </div>

        <form action="/product" method="get">
            <label for="url">Home Depot Product URL:</label>
            <input type="text" id="url" name="url" placeholder="https://www.homedepot.com/p/..." required>
            <button type="submit">Get Product Data</button>
        </form>

        <h2>Alternative Endpoints</h2>
        <p>You can also use these API endpoints directly:</p>
        <ul>
            <li><code>/api/product?url=https://www.homedepot.com/p/...</code> - Get product by URL</li>
            <li><code>/api/product?id=123456789</code> - Get product by Home Depot product ID</li>
        </ul>

        <h2>Sample Response</h2>
        <div class="example">
            <pre>{{ sample_response }}</pre>
        </div>
    </div>
</body>
</html>
"""

# HTML template for product display
PRODUCT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>{{ product.get('title', 'Product Data') }}</title>
    <style>
        /* Import 8-bit font */
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        body {
            font-family: 'Press Start 2P', cursive;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            background-color: #000;
            color: #fff;
            image-rendering: pixelated;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQImWNgYGD4z0AswK4SAFXuAf8EPy+xAAAAAElFTkSuQmCC');
            background-repeat: repeat;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            border: 4px solid #f96302; /* Home Depot Orange */
            box-shadow: 8px 8px 0 rgba(249, 99, 2, 0.3);
        }
        h1 {
            color: #f96302; /* Home Depot Orange */
            text-transform: uppercase;
            text-shadow: 2px 2px 0 #000;
            font-size: 1.5rem;
        }
        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            text-decoration: none;
            color: #f96302; /* Home Depot Orange */
            border: 3px solid #f96302;
            padding: 8px 15px;
            font-size: 0.8rem;
            text-transform: uppercase;
            box-shadow: 4px 4px 0 #000;
            transition: all 0.1s ease;
        }
        .back-link:hover {
            background-color: #f96302;
            color: #000;
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #000;
        }
        .product-info {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: 30px;
            border: 4px solid #f96302; /* Home Depot Orange */
            padding: 15px;
        }
        .product-image {
            flex: 0 0 300px;
            margin-right: 20px;
            margin-bottom: 20px;
        }
        .product-image img {
            max-width: 100%;
            height: auto;
            border: 4px solid #f96302; /* Home Depot Orange */
            image-rendering: pixelated;
        }
        .product-details {
            flex: 1;
            min-width: 300px;
        }
        .price {
            font-size: 1.2rem;
            color: #f96302; /* Home Depot Orange */
            font-weight: bold;
            margin: 15px 0;
            text-shadow: 2px 2px 0 #000;
        }
        .rating {
            margin: 15px 0;
            font-size: 0.8rem;
        }
        .specs-section, .features-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
        }
        h2 {
            color: #f96302; /* Home Depot Orange */
            text-transform: uppercase;
            border-bottom: 4px solid #f96302;
            padding-bottom: 10px;
            font-size: 1rem;
            text-shadow: 2px 2px 0 #000;
        }
        .specs-list, .features-list {
            list-style-type: none;
            padding: 0;
        }
        .specs-list li, .features-list li {
            padding: 10px 0;
            border-bottom: 2px solid #f96302; /* Home Depot Orange */
            font-size: 0.7rem;
        }
        .specs-list li:last-child, .features-list li:last-child {
            border-bottom: none;
        }
        .specs-list li strong {
            color: #f96302; /* Home Depot Orange */
            display: block;
            margin-bottom: 5px;
        }
        .brand {
            color: #f96302; /* Home Depot Orange */
            font-size: 0.9rem;
            text-transform: uppercase;
        }
        .model {
            color: #fff;
            margin-bottom: 20px;
            font-size: 0.7rem;
        }
        .raw-data {
            margin-top: 30px;
        }
        .raw-data details {
            background-color: #000;
            padding: 15px;
            border: 4px solid #f96302; /* Home Depot Orange */
        }
        .raw-data summary {
            cursor: pointer;
            padding: 10px;
            font-weight: bold;
            color: #f96302; /* Home Depot Orange */
            text-transform: uppercase;
            font-size: 0.8rem;
        }
        .raw-data pre {
            white-space: pre-wrap;
            margin: 15px 0;
            padding: 15px;
            background-color: #000;
            border: 2px solid #f96302; /* Home Depot Orange */
            overflow-x: auto;
            font-family: 'Press Start 2P', cursive;
            font-size: 0.6rem;
            color: #f96302; /* Home Depot Orange */
        }
        .error {
            color: #f96302; /* Home Depot Orange */
            padding: 20px;
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
            margin-bottom: 20px;
            font-size: 0.8rem;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="container">
        <a href="/" class="back-link">← Back to Home</a>

        {% if error %}
            <div class="error">
                <h2>Error</h2>
                <p>{{ error }}</p>
            </div>
        {% else %}
            <h1>{{ product.get('title', 'Product Information') }}</h1>

            <div class="product-info">
                <div class="product-image">
                    {% if product.get('main_image') %}
                        <img src="{{ product.get('main_image', {}).get('link', '') }}" alt="{{ product.get('title', 'Product Image') }}">
                    {% endif %}
                </div>

                <div class="product-details">
                    <div class="brand">{{ product.get('brand', 'Unknown Brand') }}</div>
                    <div class="model">Model # {{ product.get('model_number', 'N/A') }}</div>

                    {% if product.get('buybox_winner') %}
                        <div class="price">
                            {{ product.get('buybox_winner', {}).get('currency_symbol', '$') }}{{ product.get('buybox_winner', {}).get('price', 'N/A') }}
                        </div>
                    {% endif %}

                    <div class="rating">
                        Rating: {{ product.get('rating', 'N/A') }}/5 ({{ product.get('ratings_total', 0) }} reviews)
                    </div>

                    {% if product.get('description') %}
                        <p>{{ product.get('description', '') }}</p>
                    {% endif %}
                </div>
            </div>

            {% if product.get('feature_bullets') %}
                <div class="features-section">
                    <h2>Features</h2>
                    <ul class="features-list">
                        {% for feature in product.get('feature_bullets', []) %}
                            <li>{{ feature }}</li>
                        {% endfor %}
                    </ul>
                </div>
            {% endif %}

            {% if product.get('specifications') %}
                <div class="specs-section">
                    <h2>Specifications</h2>
                    <ul class="specs-list">
                        {% for spec in product.get('specifications', []) %}
                            <li><strong>{{ spec.get('name', '') }}:</strong> {{ spec.get('value', 'N/A') }}</li>
                        {% endfor %}
                    </ul>
                </div>
            {% endif %}

            <div class="raw-data">
                <details>
                    <summary>View Raw JSON Data</summary>
                    <pre>{{ raw_data }}</pre>
                </details>
            </div>
        {% endif %}
    </div>
</body>
</html>
"""

def get_product_by_url(url):
    """Fetch product data by URL"""
    if has_requests:
        # Use requests library if available
        params = {
            'api_key': API_KEY,
            'type': 'product',
            'url': url
        }
        try:
            response = requests.get('https://api.bigboxapi.com/request', params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"API request failed: {str(e)}"}
    else:
        # Fall back to urllib if requests is not available
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
    if has_requests:
        # Use requests library if available
        params = {
            'api_key': API_KEY,
            'type': 'product',
            'item_id': item_id
        }
        try:
            response = requests.get('https://api.bigboxapi.com/request', params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": f"API request failed: {str(e)}"}
    else:
        # Fall back to urllib if requests is not available
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

@app.route('/')
def home():
    """Home page"""
    # Load sample data for display
    sample_data = get_sample_product()

    # Format the sample data for display
    if 'product' in sample_data:
        formatted_sample = {
            "product": {
                "title": sample_data['product']['title'],
                "brand": sample_data['product']['brand'],
                "rating": sample_data['product']['rating'],
                "price": sample_data['product']['buybox_winner']['price']
            }
        }
    else:
        formatted_sample = {"error": "Sample data not available"}

    # Determine API status based on availability of requests library
    api_status = "Live mode available" if has_requests else "Offline mode only (requests library not installed)"

    return render_template_string(
        HOME_TEMPLATE,
        api_status=api_status,
        sample_response=json.dumps(formatted_sample, indent=2)
    )

@app.route('/product')
def product_page():
    """Product details page"""
    url = request.args.get('url')
    product_id = request.args.get('id')

    if url:
        # Try to get live data first
        result = get_product_by_url(url)

        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()

    elif product_id:
        # Try to get live data first
        result = get_product_by_id(product_id)

        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()
    else:
        result = {"error": "No URL or product ID provided"}

    # Extract product data or error message
    if 'product' in result:
        product_data = result['product']
        error = None
        raw_data = json.dumps(result, indent=2)
    else:
        product_data = {}
        error = result.get('error', 'Unknown error occurred')
        raw_data = json.dumps(result, indent=2)

    return render_template_string(
        PRODUCT_TEMPLATE,
        product=product_data,
        error=error,
        raw_data=raw_data
    )

@app.route('/api/product')
def product_api():
    """API endpoint for product data"""
    url = request.args.get('url')
    product_id = request.args.get('id')

    if url:
        # Try to get live data first
        result = get_product_by_url(url)

        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()

    elif product_id:
        # Try to get live data first
        result = get_product_by_id(product_id)

        # Fall back to sample data if there's an error
        if 'error' in result:
            result = get_sample_product()
    else:
        result = {"error": "No URL or product ID provided"}

    return jsonify(result)

if __name__ == '__main__':
    # Get port from environment variable for cloud deployment
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)
