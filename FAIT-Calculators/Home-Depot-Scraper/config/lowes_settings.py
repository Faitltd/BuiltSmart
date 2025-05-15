#!/usr/bin/env python3
"""
Configuration settings for the Lowe's Scraper.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# API settings
# Get API key from environment variables
API_KEY = os.environ.get("LOWES_API_KEY")
# This is the API key that will be used by the Lowes scraper
LOWES_API_KEY = os.environ.get("LOWES_API_KEY")

# Directory settings
RAW_DATA_DIR = "data/lowes/raw"
RESULTS_DIR = "data/lowes/results"

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
MAX_PAGES = 10
DEFAULT_FORMAT = "csv"

# Optimal timing settings (based on API performance metrics)
OPTIMAL_HOURS = {
    "LOW_LOAD": {"start": 6, "end": 8},  # 6:00 AM to 8:00 AM
    "MEDIUM_LOAD": {"start": 7, "end": 9}  # 7:00 AM to 9:00 AM
}
USE_OPTIMAL_TIMING = False  # Set to False to disable optimal timing

# URL cleaning settings
CLEAN_URLS = True  # Set to True to remove query parameters from URLs

# Lowe's specific categories
LOWES_CATEGORIES = {
    "Appliances": "4294857975",
    "Bath & Faucets": "4294737305",
    "Building Materials": "4294937087",
    "Doors & Windows": "4294937087",
    "Electrical": "4294722561",
    "Flooring": "4294937087",
    "Hardware": "4294937087",
    "Heating & Cooling": "4294937087",
    "Kitchen": "4294937087",
    "Lawn & Garden": "4294937087",
    "Lighting & Ceiling Fans": "4294937087",
    "Outdoor Living": "4294937087",
    "Paint": "4294937087",
    "Plumbing": "4294937087",
    "Smart Home": "4294937087",
    "Tools": "4294937087"
}

# Product limit options
PRODUCT_LIMIT_OPTIONS = [1, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 1000, "ALL"]

# Standard CSV headers (these are the default headers that will be used)
STANDARD_CSV_HEADERS = {
    "product_name": "Item Name",
    "sku": "SKU",
    "images": "Image",
    "brand": "Manufacturer",
    "url": "URL",
    "price": "Purchase Price",
    "markup": "43%",
    "details": "Description",
    "supplier": "Lowes",
    "cost": "Price"
}

# Default CSV headers (these are the headers that will be shown in the UI)
DEFAULT_CSV_HEADERS = {
    "product_name": "Item Name",
    "sku": "SKU",
    "images": "Image",
    "brand": "Manufacturer",
    "url": "URL",
    "price": "Purchase Price",
    "sale_price": "Sale Price",
    "price": "Price",
    "markup": "Markup",
    "details": "Description",
    "item_type": "Item Type"
}
