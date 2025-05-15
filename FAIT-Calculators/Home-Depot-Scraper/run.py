#!/usr/bin/env python3
"""
Home Depot Scraper - Main Application Runner

This script starts the web application for the Home Depot Scraper.
It handles configuration loading, database initialization, and server startup.
"""

import os
import logging
from flask import Flask, render_template
from api_diagnostics_handler import handle_api_test

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask application
app = Flask(__name__)

# Import routes after app is created to avoid circular imports
from api_routes import api_routes

# Register blueprints
app.register_blueprint(api_routes)

# Add this import
from app_file import app_blueprint

# Add this after creating the Flask app
app.register_blueprint(app_blueprint)

# Import the Lowe's blueprint
from lowes_app import app as lowes_blueprint

# Register the Lowe's blueprint with a URL prefix
app.register_blueprint(lowes_blueprint, url_prefix='/lowes')

@app.route('/')
def index():
    """Render the main page."""
    # Define the search_types dictionary
    search_types = {
        'term': 'Search by Term',
        'category': 'Search by Category',
        'url': 'Search by URL'
        # Add any other search types your application uses
    }
    
    # Pass search_types to the template
    return render_template('index.html', search_types=search_types)

@app.route('/api/diagnostics')
def api_diagnostics():
    """Render the API diagnostics page."""
    return render_template('api_diagnostics.html')

@app.route('/api/test', methods=['POST'])
def api_test():
    """API endpoint to test BigBox API connection."""
    return handle_api_test()

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    
    logger.info(f"Starting Home Depot Scraper on port {port} (debug={debug})")
    app.run(host="0.0.0.0", port=port, debug=debug)
