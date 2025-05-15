#!/usr/bin/env python3
"""
Combined Scraper Web Application

This Flask application provides a web interface for both the Home Depot and Lowe's scrapers,
allowing users to switch between them and run scraping jobs with different search types.
"""

import os
import logging
from flask import Flask, redirect, url_for
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create the combined Flask app
app = Flask(__name__)

# Import the individual apps
from app import app as homedepot_blueprint
from lowes_app import app as lowes_blueprint

# Register the Home Depot app's routes
app.register_blueprint(homedepot_blueprint)

# Register the Lowe's app's routes
app.register_blueprint(lowes_blueprint)

# Root route
@app.route('/')
def home():
    """Redirect to Home Depot combined page."""
    return redirect(url_for('homedepot_app.combined_page'))

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
