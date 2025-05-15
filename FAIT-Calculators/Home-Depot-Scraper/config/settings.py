#!/usr/bin/env python3
"""
Configuration settings for the Home Depot Scraper.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API settings
# Default to empty string if not set in environment
API_KEY = os.environ.get("BIGBOX_API_KEY", "")

# Directory settings
RAW_DATA_DIR = "data/raw"
RESULTS_DIR = "data/results"

# CSV template settings
CSV_TEMPLATE = {
    "headers": [
        "product_name", "sku", "item_id", "model_number", "upc", "url",
        "price", "currency", "unit", "details", "specifications", "brand",
        "images", "markup", "supplier", "cost"
    ],
    "default_currency": "$ USD",
    "default_unit": "each"
}

# Scraper settings
DEFAULT_DELAY = 1.5
MAX_PAGES = 10  # Increased from 2 to get more products
DEFAULT_FORMAT = "csv"

# URL cleaning settings
CLEAN_URLS = True  # Set to True to remove query parameters from URLs
