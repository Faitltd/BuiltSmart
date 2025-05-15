#!/usr/bin/env python3
"""
Utility functions for the Home Depot Scraper.
"""

import os
import re
import csv
import json
from urllib.parse import urlparse, urlunparse
from datetime import datetime

def clean_url(url):
    """
    Clean a URL by removing query parameters.

    Args:
        url (str): The URL to clean

    Returns:
        str: The cleaned URL
    """
    parsed = urlparse(url)
    clean_parsed = parsed._replace(query="", fragment="")
    return urlunparse(clean_parsed)

def clean_filename(filename):
    """
    Clean a filename by removing invalid characters.

    Args:
        filename (str): The filename to clean

    Returns:
        str: The cleaned filename
    """
    # Remove invalid characters
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def load_urls(file_path, clean=True):
    """
    Load product URLs from a file.

    Args:
        file_path (str): Path to the file containing URLs
        clean (bool): Whether to clean the URLs

    Returns:
        list: List of unique URLs
    """
    try:
        with open(file_path, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]

            # Clean URLs if requested
            if clean:
                urls = [clean_url(url) for url in urls]

            # Remove duplicates while preserving order
            unique_urls = []
            seen = set()
            for url in urls:
                if url not in seen:
                    seen.add(url)
                    unique_urls.append(url)
            return unique_urls
    except Exception as e:
        print(f"Failed to load URLs from file: {str(e)}")
        return []

def extract_product_id(url):
    """
    Extract product ID from URL.

    Args:
        url (str): The product URL

    Returns:
        str: The product ID
    """
    try:
        # URLs are in format: https://www.homedepot.com/p/product-name/PRODUCT_ID
        parts = url.strip('/').split('/')
        return parts[-1]
    except Exception:
        return None

def convert_to_template(input_data, template_headers, custom_headers=None):
    """
    Convert scraped data to match the template format.

    Args:
        input_data (dict): The scraped product data
        template_headers (list): The template headers
        custom_headers (dict, optional): Custom header name mapping

    Returns:
        dict: The converted data
    """
    new_row = {header: '' for header in template_headers}

    # Map fields from input to template
    new_row['product_name'] = input_data.get('name', '')

    # Ensure SKU is not empty
    sku = input_data.get('sku', '')
    if not sku:
        # Try to get SKU from other fields
        sku = (input_data.get('item_id', '') or
               input_data.get('model_number', '') or
               input_data.get('upc', ''))
    new_row['sku'] = sku

    new_row['item_id'] = input_data.get('item_id', '')
    new_row['model_number'] = input_data.get('model_number', '')
    new_row['upc'] = input_data.get('upc', '')
    new_row['url'] = input_data.get('url', '')

    # Handle price formatting
    price = input_data.get('price', '')
    if price:
        try:
            if isinstance(price, (int, float)):
                price = f"{price:.2f}"
        except:
            pass
    new_row['price'] = price

    # Set the same price as cost
    new_row['cost'] = price

    new_row['currency'] = input_data.get('currency', '$ USD')
    new_row['unit'] = input_data.get('unit', 'each')

    # Add brand as manufacturer
    new_row['brand'] = input_data.get('brand', '')

    # Add image URL
    images = input_data.get('images', [])
    if images and isinstance(images, list) and len(images) > 0:
        # Get the first image URL
        new_row['images'] = images[0] if isinstance(images[0], str) else ''
    elif images and isinstance(images, str):
        new_row['images'] = images
    else:
        new_row['images'] = ''

    # Add fixed markup
    new_row['markup'] = '43%'

    # Add supplier
    new_row['supplier'] = 'HD'

    # Combine description and features for details
    details = input_data.get('description', '')
    if not details:
        # Try to build details from other fields
        details_parts = []

        # Add name if available
        if input_data.get('name'):
            details_parts.append(input_data['name'])

        # Add brand if available
        if input_data.get('brand'):
            details_parts.append(f"Brand: {input_data['brand']}")

        # Add features if available
        if input_data.get('features'):
            if isinstance(input_data['features'], list):
                features_str = ' | '.join(input_data['features'])
                details_parts.append(features_str)
            elif isinstance(input_data['features'], str):
                details_parts.append(input_data['features'])

        # Combine all parts
        if details_parts:
            details = ' | '.join(details_parts)

    new_row['details'] = details

    # Combine all specifications
    specs = []

    # Add brand if available
    if input_data.get('brand'):
        specs.append(f"Brand: {input_data['brand']}")

    # Add other specifications
    for key, value in input_data.items():
        if key not in ['brand', 'currency', 'description', 'images', 'item_id',
                      'model_number', 'name', 'price', 'rating', 'ratings_total',
                      'upc', 'url', 'features', 'sku', 'specifications'] and value:
            specs.append(f"{key}: {value}")

    # Add specifications if available
    if isinstance(input_data.get('specifications'), list):
        for spec in input_data['specifications']:
            if isinstance(spec, dict) and 'name' in spec and 'value' in spec:
                specs.append(f"{spec['name']}: {spec['value']}")

    # Add features if available
    if input_data.get('features'):
        try:
            if isinstance(input_data['features'], str):
                if input_data['features']:
                    specs.append(f"Features: {input_data['features']}")
            elif isinstance(input_data['features'], list):
                features_str = ', '.join(input_data['features'])
                specs.append(f"Features: {features_str}")
        except Exception as e:
            # Log the error but continue
            print(f"Error processing features: {str(e)}")

    new_row['specifications'] = ' | '.join(specs)

    return new_row

def get_output_filename(prefix="homedepot", suffix="products", extension="csv"):
    """
    Generate an output filename with the current date.

    Args:
        prefix (str): Prefix for the filename
        suffix (str): Suffix for the filename
        extension (str): File extension

    Returns:
        str: The generated filename
    """
    date_str = datetime.now().strftime('%Y-%m-%d')
    return f"{prefix}_{suffix}_{date_str}.{extension}"

def apply_custom_headers(data, custom_headers):
    """
    Apply custom header names to the data.

    Args:
        data (list): List of dictionaries with product data
        custom_headers (dict): Mapping of original header names to custom header names

    Returns:
        list: Data with custom header names
    """
    if not custom_headers:
        return data

    result = []
    for item in data:
        new_item = {}
        for key, value in item.items():
            # If this key has a custom header name, use it
            if key in custom_headers and custom_headers[key]:
                new_item[custom_headers[key]] = value
            else:
                new_item[key] = value
        result.append(new_item)

    return result

def save_to_csv_with_custom_headers(data, filepath, fieldnames, custom_headers=None):
    """
    Save data to CSV with optional custom headers.

    Args:
        data (list): List of dictionaries with product data
        filepath (str): Path to save the CSV file
        fieldnames (list): List of field names for the CSV
        custom_headers (dict, optional): Mapping of original header names to custom header names

    Returns:
        str: Path to the saved file
    """
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(filepath), exist_ok=True)

    # If custom headers are provided, create a new fieldnames list with the custom names
    if custom_headers:
        custom_fieldnames = []
        for field in fieldnames:
            if field in custom_headers and custom_headers[field]:
                custom_fieldnames.append(custom_headers[field])
            else:
                custom_fieldnames.append(field)
    else:
        custom_fieldnames = fieldnames

    # Write to CSV
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=custom_fieldnames)
        writer.writeheader()

        # If custom headers are provided, rename the keys in the data
        if custom_headers:
            for item in data:
                row = {}
                for key, value in item.items():
                    if key in custom_headers and custom_headers[key]:
                        row[custom_headers[key]] = value
                    else:
                        row[key] = value
                writer.writerow(row)
        else:
            writer.writerows(data)

    return filepath
