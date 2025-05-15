"""
Utility functions for the Lowe's scraper.
"""

import os
import re
import csv
import json
import time
import logging
from urllib.parse import urlparse, parse_qs
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

def clean_url(url):
    """Remove query parameters from a URL.

    Args:
        url (str): URL to clean

    Returns:
        str: Cleaned URL
    """
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

def clean_filename(s):
    """Convert a string to a valid filename.

    Args:
        s (str): String to convert

    Returns:
        str: Valid filename
    """
    # Replace invalid characters with underscores
    s = re.sub(r'[\\/*?:"<>|]', '_', s)
    # Replace spaces with underscores
    s = s.replace(' ', '_')
    # Limit length
    return s[:50]

def extract_product_id(url):
    """Extract the product ID from a Lowe's product URL.

    Args:
        url (str): Lowe's product URL

    Returns:
        str: Product ID or a placeholder if not found
    """
    try:
        parsed_url = urlparse(url)

        # Check if it's a Lowe's URL
        if 'lowes.com' not in parsed_url.netloc:
            return f"unknown_{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Extract the product ID from the path
        path_parts = parsed_url.path.strip('/').split('/')
        if len(path_parts) >= 3 and path_parts[0] == 'pd':
            return path_parts[-1]  # Last part should be the product ID

        # If we can't extract the ID from the path, try the query parameters
        query_params = parse_qs(parsed_url.query)
        if 'productId' in query_params:
            return query_params['productId'][0]

        # If all else fails, use a timestamp as a placeholder
        return f"unknown_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    except Exception as e:
        logger.error(f"Error extracting product ID from URL: {str(e)}")
        return f"error_{datetime.now().strftime('%Y%m%d%H%M%S')}"

def get_output_filename(output_dir, format, prefix="lowes_products", suffix=""):
    """Generate an output filename based on the current date and time.

    Args:
        output_dir (str): Output directory
        format (str): File format ('csv' or 'json')
        prefix (str, optional): Filename prefix
        suffix (str, optional): Filename suffix

    Returns:
        str: Output filename
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}{suffix}.{format}"
    return os.path.join(output_dir, filename)

def convert_to_template(product, template):
    """Convert a product to the template format.

    Args:
        product (dict): Product data
        template (dict): Template configuration

    Returns:
        dict: Product data in template format
    """
    result = {header: "" for header in template['headers']}

    # Map product data to template
    if 'title' in product:
        result['product_name'] = product['title']

    if 'item_id' in product:
        result['item_id'] = product['item_id']
        # Also use item_id as SKU if no specific SKU is available
        result['sku'] = product.get('store_sku', product['item_id'])

    if 'model_id' in product:
        result['model_number'] = product['model_id']
    elif 'model_number' in product:
        result['model_number'] = product['model_number']

    if 'upc' in product:
        result['upc'] = product['upc']

    if 'url' in product:
        result['url'] = product['url']

    # Extract price information
    if 'buybox_winner' in product and product['buybox_winner']:
        buybox = product['buybox_winner']
        if 'price' in buybox:
            result['price'] = buybox['price']
        result['currency'] = template['default_currency']
        result['unit'] = template['default_unit']
    elif 'price' in product:
        # Direct price field
        result['price'] = product['price']
        result['currency'] = template['default_currency']
        result['unit'] = template['default_unit']

    # Extract description
    if 'description' in product and product['description']:
        result['details'] = product['description']
    elif 'feature_bullets' in product and product['feature_bullets']:
        # Use feature bullets as description if available
        result['details'] = "\n".join(product['feature_bullets'])

    # Extract specifications
    if 'specifications' in product and product['specifications']:
        specs = []
        for spec in product['specifications']:
            if isinstance(spec, dict) and 'name' in spec and 'value' in spec:
                specs.append(f"{spec['name']}: {spec['value']}")
        result['specifications'] = " | ".join(specs)

    # Extract brand information
    if 'brand' in product:
        result['brand'] = product['brand']

    # Extract images
    if 'images' in product and product['images']:
        if isinstance(product['images'], list):
            # If it's a list of image objects with 'link' property
            if product['images'] and isinstance(product['images'][0], dict) and 'link' in product['images'][0]:
                result['images'] = product['images'][0]['link']
            # If it's a list of image URLs
            elif product['images'] and isinstance(product['images'][0], str):
                result['images'] = product['images'][0]
        elif isinstance(product['images'], str):
            # If it's a single image URL
            result['images'] = product['images']

    # Add default values
    result['supplier'] = "Lowes"
    result['markup'] = "43%"

    # Copy price to cost
    if result['price']:
        result['cost'] = result['price']

    # Debug log to check what's being returned
    logger.debug(f"Converted product template: {result}")
    
    return result

def load_urls(file_path):
    """Load URLs from a file.

    Args:
        file_path (str): Path to the file containing URLs

    Returns:
        list: List of URLs
    """
    urls = []
    try:
        with open(file_path, 'r') as f:
            for line in f:
                url = line.strip()
                if url and not url.startswith('#'):
                    urls.append(url)
        logger.info(f"Loaded {len(urls)} URLs from {file_path}")
    except Exception as e:
        logger.error(f"Error loading URLs from {file_path}: {str(e)}")

    return urls

def save_to_csv_with_custom_headers(products, output_file, custom_headers):
    """Save products to CSV with custom headers.

    Args:
        products (list): List of product dictionaries
        output_file (str): Output file path
        custom_headers (dict): Mapping of internal field names to CSV headers

    Returns:
        str: Path to the saved file
    """
    # Create a new list with the custom headers
    formatted_products = []
    
    for product in products:
        formatted_product = {}
        
        # Map each field according to the custom headers
        for internal_field, csv_header in custom_headers.items():
            # Get the value from the product, or empty string if not found
            value = product.get(internal_field, "")
            
            # Special handling for images
            if internal_field == 'images' and value:
                # If it's a list of image objects with 'link' property
                if isinstance(value, list) and value and isinstance(value[0], dict) and 'link' in value[0]:
                    formatted_product[csv_header] = value[0]['link']
                # If it's a list of image URLs
                elif isinstance(value, list) and value and isinstance(value[0], str):
                    formatted_product[csv_header] = value[0]
                # If it's a single image URL
                elif isinstance(value, str):
                    formatted_product[csv_header] = value
                else:
                    formatted_product[csv_header] = ""
            else:
                formatted_product[csv_header] = value
        
        formatted_products.append(formatted_product)
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        if formatted_products:
            writer = csv.DictWriter(f, fieldnames=list(custom_headers.values()))
            writer.writeheader()
            writer.writerows(formatted_products)
        else:
            # Create empty file with headers
            writer = csv.DictWriter(f, fieldnames=list(custom_headers.values()))
            writer.writeheader()
    
    return output_file

def is_optimal_time():
    """Check if the current time is within the optimal hours for API requests.

    Returns:
        bool: True if current time is optimal, False otherwise
    """
    try:
        from config.lowes_settings import OPTIMAL_HOURS, USE_OPTIMAL_TIMING

        # If optimal timing is disabled, always return True
        if not USE_OPTIMAL_TIMING:
            return True

        current_hour = datetime.now().hour

        # Check if current hour is in any of the optimal ranges
        for load_level, hours in OPTIMAL_HOURS.items():
            if hours["start"] <= current_hour < hours["end"]:
                logger.info(f"Current time ({current_hour}:00) is within optimal {load_level} hours")
                return True

        # If we're here, we're outside optimal hours
        logger.warning(f"Current time ({current_hour}:00) is outside optimal hours")
        # But since we've disabled optimal timing in settings, we'll return True anyway
        return True
    except Exception as e:
        logger.error(f"Error checking optimal time: {str(e)}")
        # Default to True if there's an error
        return True

def wait_for_optimal_time(max_wait_minutes=60):
    """Wait until the current time is within the optimal hours.

    Args:
        max_wait_minutes (int): Maximum time to wait in minutes

    Returns:
        bool: True if waited successfully, False if max wait time exceeded
    """
    try:
        from config.lowes_settings import OPTIMAL_HOURS, USE_OPTIMAL_TIMING

        # If optimal timing is disabled, return immediately
        if not USE_OPTIMAL_TIMING:
            return True

        start_time = datetime.now()
        max_wait_time = start_time + datetime.timedelta(minutes=max_wait_minutes)

        while datetime.now() < max_wait_time:
            if is_optimal_time():
                return True

            # Wait for 5 minutes before checking again
            logger.info(f"Waiting for optimal time... (will check again in 5 minutes)")
            time.sleep(300)  # 5 minutes

        logger.warning(f"Max wait time exceeded ({max_wait_minutes} minutes)")
        return False
    except Exception as e:
        logger.error(f"Error waiting for optimal time: {str(e)}")
        # Default to True if there's an error
        return True
