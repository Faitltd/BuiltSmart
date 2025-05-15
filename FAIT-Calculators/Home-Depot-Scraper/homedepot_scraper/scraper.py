"""
Home Depot Scraper Module

This module provides functionality to scrape product data from Home Depot's
building materials category and subcategories.
"""

import os
import json
import time
import logging
import csv
from datetime import datetime
from urllib.parse import urljoin

from .api import HomeDepotClient
from .utils import clean_url, clean_filename, extract_product_id, convert_to_template, get_output_filename, save_to_csv_with_custom_headers
from config.settings import RAW_DATA_DIR, RESULTS_DIR, CSV_TEMPLATE, CLEAN_URLS

# Configure logging
logger = logging.getLogger(__name__)

# Set logging level to DEBUG for more detailed output
logger.setLevel(logging.DEBUG)

# Category IDs for building materials and subcategories
CATEGORY_IDS = {
    "Building Materials": "N-5yc1vZaqns",
    "Lumber & Composites": "N-5yc1vZbqmz",
    "Concrete, Cement & Masonry": "N-5yc1vZaq7q",
    "Decking": "N-5yc1vZbqpg",
    "Fencing": "N-5yc1vZbqly",
    "Moulding & Millwork": "N-5yc1vZbqmk",
    "Insulation": "N-5yc1vZasbs",
    "Drywall": "N-5yc1vZarxx",
    "Roofing": "N-5yc1vZasbm",
    "Gutter Systems": "N-5yc1vZar4d",
    "Plywood": "N-5yc1vZbqm7",
    "Boards, Planks & Panels": "N-5yc1vZbt1a",
    "Siding": "N-5yc1vZaq25",
    "Ladders": "N-5yc1vZaquu",
    "Dimensional Lumber": "N-5yc1vZbqm8",
    "Building Hardware": "N-5yc1vZc2ek",
    "Ventilation": "N-5yc1vZc4k0",
    "Ceilings": "N-5yc1vZaq4z",
    "Tools": "N-5yc1vZc1xy"
}

class HomeDepotScraper:
    """Scraper for Home Depot building materials products."""

    def __init__(self, api_key, output_dir="data", max_retries=3, delay=1):
        """Initialize the scraper.

        Args:
            api_key (str): BigBox API key
            output_dir (str): Directory to store output data
            max_retries (int): Maximum number of retries for failed requests
            delay (int): Delay between API requests in seconds
        """
        self.client = HomeDepotClient(api_key, max_retries=max_retries)
        self.output_dir = output_dir
        self.delay = delay
        self.products = []
        self.product_urls = set()  # Use a set to avoid duplicates

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Check if we're using the Desktop
        is_desktop = os.path.basename(os.path.normpath(output_dir)) == 'Desktop'

        # For Desktop, we'll save directly to it without subdirectories
        if not is_desktop:
            # Create subdirectories for raw data and results
            os.makedirs(os.path.join(output_dir, "raw"), exist_ok=True)
            os.makedirs(os.path.join(output_dir, "results"), exist_ok=True)

        self.is_desktop = is_desktop

    def scrape_specific_urls(self, urls, job=None):
        """Scrape specific product URLs.

        Args:
            urls (list): List of product URLs to scrape
            job: Optional job object to update progress

        Returns:
            list: List of scraped products
        """
        logger.info(f"Starting to scrape {len(urls)} specific product URLs")

        # Clean URLs if configured
        if CLEAN_URLS:
            urls = [clean_url(url) for url in urls]

        # Remove duplicates while preserving order
        unique_urls = []
        seen = set()
        for url in urls:
            if url not in seen and url.startswith('https://www.homedepot.com/p/'):
                seen.add(url)
                unique_urls.append(url)

        logger.info(f"Found {len(unique_urls)} unique product URLs")

        # Initialize product progress if job is provided
        if job:
            job.update_product_progress(0, len(unique_urls))

        # Process each URL
        for i, url in enumerate(unique_urls):
            if i % 10 == 0:
                logger.info(f"Processing URL {i+1} of {len(unique_urls)}")

            # Update product progress if job is provided
            if job:
                job.update_product_progress(i, len(unique_urls))

            try:
                # Extract product ID from URL
                product_id = extract_product_id(url)
                if not product_id:
                    logger.error(f"Could not extract product ID from URL: {url}")
                    continue

                # Add delay between requests
                time.sleep(self.delay)

                # Fetch product details with detailed logging
                logger.info(f"Fetching details for URL: {url}")
                product_data = self.client.get_product_by_url(url)

                # Log the raw API response for debugging
                logger.debug(f"API Response for {url}: {json.dumps(product_data, indent=2)}")

                if not product_data:
                    logger.error(f"Failed to fetch details for URL: {url} - No data returned")
                    continue

                # Log more detailed information about the response
                if 'product' in product_data:
                    logger.info(f"Product data received for {url}: {product_data['product'].get('title', 'No title')}")
                    logger.info(f"Product fields available: {list(product_data['product'].keys())}")
                else:
                    logger.info(f"Response structure for {url}: {list(product_data.keys())}")

                # Save raw product data
                self._save_raw_data(f"product_{product_id}.json", product_data)

                # Process product data
                logger.info(f"Raw product data keys: {list(product_data.keys())}")

                if 'product' in product_data:
                    logger.info(f"Processing product data for {url}")
                    logger.debug(f"Available product fields: {list(product_data['product'].keys())}")

                    # Check for SKU in various fields
                    sku = None
                    sku_fields = ['store_sku', 'sku', 'item_id', 'model_id', 'model_number', 'product_id']
                    for field in sku_fields:
                        if product_data['product'].get(field):
                            sku = product_data['product'].get(field)
                            logger.info(f"Found SKU in {field}: {sku}")
                            break

                    # If no SKU found, use product_id as fallback
                    if not sku:
                        sku = product_id
                        logger.info(f"Using product_id as SKU: {sku}")

                    # Check for description in various fields
                    description = None
                    desc_fields = ['description', 'long_description', 'short_description', 'details', 'product_description']
                    for field in desc_fields:
                        if product_data['product'].get(field):
                            description = product_data['product'].get(field)
                            logger.info(f"Found description in {field} ({len(description)} chars)")
                            break

                    # Get price from the buybox_winner field
                    price = '0.00'
                    if 'buybox_winner' in product_data['product'] and product_data['product']['buybox_winner']:
                        buybox = product_data['product']['buybox_winner']
                        if 'price' in buybox and buybox['price']:
                            price = buybox['price']
                            logger.info(f"Found price in buybox_winner: {price}")

                    # Create product info dictionary
                    product_info = {
                        'url': url,
                        'item_id': product_id,
                        'sku': sku,
                        'name': product_data['product'].get('title'),
                        'brand': product_data['product'].get('brand'),
                        'price': price,
                        'currency': product_data['product'].get('currency'),
                        'description': description,
                        'specifications': product_data['product'].get('specifications'),
                        'features': product_data['product'].get('features'),
                        'images': product_data['product'].get('images'),
                        'rating': product_data['product'].get('rating'),
                        'ratings_total': product_data['product'].get('ratings_total'),
                        'model_number': product_data['product'].get('model_number'),
                        'upc': product_data['product'].get('upc'),
                        'buybox_winner': product_data['product'].get('buybox_winner')
                    }

                    # Add to products list
                    self.products.append(product_info)
                    logger.info(f"Successfully scraped product: {product_info.get('name', product_id)}")
                    logger.info(f"Total products scraped so far: {len(self.products)}")
                elif 'request_info' in product_data and 'success' in product_data['request_info']:
                    # Check if the API request was successful but returned a different format
                    if not product_data['request_info']['success']:
                        logger.error(f"API request failed for URL: {url}")
                        if 'error' in product_data:
                            logger.error(f"API error: {product_data['error']}")
                    else:
                        logger.error(f"API request successful but unexpected format for URL: {url}")
                        logger.debug(f"Available fields in response: {list(product_data.keys())}")

                        # Try to extract product data from a different structure
                        if 'buybox_winner' in product_data:
                            logger.info(f"Found buybox_winner directly in response for URL: {url}")

                            # Create a minimal product info
                            product_info = {
                                'url': url,
                                'item_id': product_id,
                                'sku': product_id,
                                'price': product_data.get('buybox_winner', {}).get('price', '0.00'),
                                'name': product_data.get('title', f"Product {product_id}"),
                                'brand': product_data.get('brand', ''),
                                'description': product_data.get('description', ''),
                                'images': product_data.get('images', [])
                            }

                            # Add to products list
                            self.products.append(product_info)
                            logger.info(f"Successfully scraped product with alternative format: {product_info.get('name', product_id)}")
                            logger.info(f"Total products scraped so far: {len(self.products)}")
                else:
                    logger.error(f"Failed to extract details for URL: {url} - No 'product' field in response")
                    logger.debug(f"Available fields in response: {list(product_data.keys())}")

            except Exception as e:
                logger.exception(f"Error processing URL {url}: {str(e)}")

            # Update product progress after each URL if job is provided
            if job:
                job.update_product_progress(i + 1, len(unique_urls))

        # Final update to product progress if job is provided
        if job:
            job.update_product_progress(len(unique_urls), len(unique_urls))

        logger.info(f"Completed scraping specific URLs. Total products: {len(self.products)}")
        return self.products

    def _save_raw_data(self, filename, data):
        """Save raw data to a JSON file.

        Args:
            filename (str): Name of the file
            data (dict): Data to save
        """
        # If using Desktop, save directly to it
        if hasattr(self, 'is_desktop') and self.is_desktop:
            filepath = os.path.join(self.output_dir, f"homedepot_raw_{filename}")
        else:
            # Ensure raw directory exists
            raw_dir = os.path.join(self.output_dir, "raw")
            os.makedirs(raw_dir, exist_ok=True)
            filepath = os.path.join(raw_dir, filename)
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
            logger.debug(f"Saved raw data to {filepath}")
        except Exception as e:
            logger.error(f"Error saving raw data to {filepath}: {str(e)}")

    def save_results(self, format='csv', output_file=None):
        """Save scraped products to a file.

        Args:
            format (str): Output format ('csv' or 'json')
            output_file (str, optional): Output filename

        Returns:
            str: Path to the saved file
        """
        if not self.products:
            logger.warning("No products to save")
            return None

        # Generate output filename if not provided
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"homedepot_results_{timestamp}.{format}"

        # Determine output path
        if hasattr(self, 'is_desktop') and self.is_desktop:
            output_path = os.path.join(self.output_dir, output_file)
        else:
            # Ensure results directory exists
            results_dir = os.path.join(self.output_dir, "results")
            os.makedirs(results_dir, exist_ok=True)
            output_path = os.path.join(results_dir, output_file)

        try:
            if format.lower() == 'csv':
                # Save to CSV
                with open(output_path, 'w', newline='', encoding='utf-8') as f:
                    # Get all fields from the first product
                    fieldnames = list(self.products[0].keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(self.products)
            elif format.lower() == 'json':
                # Save to JSON
                with open(output_path, 'w', encoding='utf-8') as f:
                    json.dump(self.products, f, indent=2)
            else:
                logger.error(f"Unsupported format: {format}")
                return None

            logger.info(f"Saved {len(self.products)} products to {output_path}")
            return output_path
        except Exception as e:
            logger.exception(f"Error saving results to {output_path}: {str(e)}")
            return None

def scrape_search_term(self, search_term, max_pages=5, max_products=0, sort_by=None):
    """Scrape products from a search term."""
    logger.info(f"Scraping search term: '{search_term}'")
    logger.info(f"Max pages: {max_pages}, Max products: {max_products}, Sort by: {sort_by}")
    
    product_urls = []
    
    try:
        # Log API key status (masked)
        api_key = self.api_key
        masked_key = f"{'*' * (len(api_key) - 4)}{api_key[-4:]}" if api_key and len(api_key) > 4 else "Not set or invalid"
        logger.info(f"Using API key: {masked_key}")
        
        # Prepare search parameters
        params = {
            'search_term': search_term,
            'page': 1
        }
        
        if sort_by:
            params['sort_by'] = sort_by
            
        logger.info(f"Making API request with params: {params}")
        
        # Make the initial request with retry logic
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                # Check if we have a client attribute, if not create one
                if not hasattr(self, 'client') or self.client is None:
                    logger.warning("API client not initialized, attempting to create one")
                    # Import the client here to avoid circular imports
                    from bigbox_api_client.client import BigBoxClient
                    self.client = BigBoxClient(api_key=self.api_key)
                
                response = self.client.search_products(**params)
                
                # Log the response structure for debugging
                if isinstance(response, dict):
                    logger.info(f"Response keys: {list(response.keys())}")
                    
                    # Check if the request was successful
                    if response.get('request_info', {}).get('success', False):
                        logger.info("Search request successful")
                        
                        # Log credits information
                        credits_remaining = response.get('request_info', {}).get('credits_remaining', 'unknown')
                        logger.info(f"Credits remaining: {credits_remaining}")
                        
                        # Check if we have search results
                        if 'search_results' in response:
                            products = response.get('search_results', [])
                            logger.info(f"Found {len(products)} products in search results")
                            
                            # Extract product URLs
                            for product_data in products:
                                if 'product' in product_data:
                                    product = product_data['product']
                                    if 'link' in product:
                                        product_urls.append(product['link'])
                                    elif 'url' in product:
                                        product_urls.append(product['url'])
                            
                            logger.info(f"Extracted {len(product_urls)} product URLs")
                            
                            # Get total pages
                            total_pages = response.get('search', {}).get('pagination', {}).get('total_pages', 1)
                            logger.info(f"Total pages available: {total_pages}")
                            
                            # Limit pages if needed
                            pages_to_scrape = min(max_pages, total_pages) if max_pages else total_pages
                            logger.info(f"Will scrape {pages_to_scrape} pages")
                            
                            # Scrape additional pages if needed
                            for page in range(2, pages_to_scrape + 1):
                                if max_products and len(product_urls) >= max_products:
                                    logger.info(f"Reached max products limit ({max_products}), stopping pagination")
                                    break
                                    
                                logger.info(f"Scraping page {page}/{pages_to_scrape}")
                                params['page'] = page
                                page_response = self.client.search_products(**params)
                                
                                if isinstance(page_response, dict) and page_response.get('request_info', {}).get('success', False):
                                    page_products = page_response.get('search_results', [])
                                    logger.info(f"Found {len(page_products)} products on page {page}")
                                    
                                    # Extract product URLs
                                    for product_data in page_products:
                                        if 'product' in product_data:
                                            product = product_data['product']
                                            if 'link' in product:
                                                product_urls.append(product['link'])
                                            elif 'url' in product:
                                                product_urls.append(product['url'])
                                                
                                    logger.info(f"Total URLs collected so far: {len(product_urls)}")
                                else:
                                    logger.warning(f"Failed to get page {page}, stopping pagination")
                                    break
                        else:
                            logger.warning("No search_results found in the response")
                            if 'search' in response:
                                logger.info(f"Search keys: {list(response['search'].keys())}")
                            else:
                                logger.warning("No search data in response")
                    else:
                        error_msg = response.get('request_info', {}).get('message', 'Unknown error')
                        logger.error(f"Search request failed: {error_msg}")
                else:
                    logger.error(f"Unexpected response type: {type(response)}")
                    
                # Break the retry loop if we got here without exceptions
                break
                
            except Exception as e:
                logger.error(f"Error during API request (attempt {attempt+1}/{max_retries}): {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    logger.error("Max retries reached, giving up")
                    raise
        
        # Limit the number of products if specified
        if max_products and len(product_urls) > max_products:
            logger.info(f"Limiting to {max_products} products (from {len(product_urls)} found)")
            product_urls = product_urls[:max_products]
            
        return product_urls
        
    except Exception as e:
        logger.exception(f"Error scraping search term '{search_term}': {str(e)}")
        return []
    return product_urls

    def scrape_all_categories(self, max_pages_per_category=5, max_products=0):
        """Scrape products from all building materials categories.

        Args:
            max_pages_per_category (int): Maximum number of pages to scrape per category
            max_products (int): Maximum number of products to scrape in total (0 for all)

        Returns:
            list: List of product URLs
        """
        logger.info(f"Scraping all {len(CATEGORY_IDS)} building materials categories")
        all_urls = []

        for category_name, category_id in CATEGORY_IDS.items():
            logger.info(f"Scraping category: {category_name} ({category_id})")

            # Get URLs for this category
            category_urls = []

            # Scrape each page up to max_pages_per_category
            for page in range(1, max_pages_per_category + 1):
                logger.info(f"Scraping page {page}/{max_pages_per_category} for category '{category_name}'")

                # Add delay between requests
                if page > 1:
                    time.sleep(self.delay)

                # Get category products
                try:
                    category_data = self.client.get_category_products(category_id, page=page)

                    # Save raw category data
                    self._save_raw_data(f"category_{clean_filename(category_name)}_page_{page}.json", category_data)

                    # Extract product URLs
                    if 'category' in category_data and 'products' in category_data['category']:
                        products = category_data['category']['products']
                        logger.info(f"Found {len(products)} products on page {page}")

                        for product in products:
                            if 'link' in product:
                                url = product['link']
                                if url.startswith('https://www.homedepot.com/p/'):
                                    category_urls.append(url)
                                    # Add to set to avoid duplicates
                                    self.product_urls.add(url)

                            # Check if we've reached the max products limit
                            if max_products > 0 and len(all_urls) + len(category_urls) >= max_products:
                                logger.info(f"Reached maximum products limit ({max_products})")
                                break
                    else:
                        logger.warning(f"No products found for category '{category_name}' on page {page}")
                        break

                    # Check if we've reached the max products limit
                    if max_products > 0 and len(all_urls) + len(category_urls) >= max_products:
                        break

                    # Check if there are more pages
                    if 'category' in category_data and 'pagination' in category_data['category']:
                        pagination = category_data['category']['pagination']
                        if 'next_page_token' not in pagination or not pagination['next_page_token']:
                            logger.info(f"No more pages available for category '{category_name}'")
                            break

                except Exception as e:
                    logger.exception(f"Error scraping page {page} for category '{category_name}': {str(e)}")
                    break

            # Add category URLs to the list
            all_urls.extend(category_urls)
            logger.info(f"Found {len(category_urls)} product URLs for category '{category_name}'")

            # Check if we've reached the max products limit
            if max_products > 0 and len(all_urls) >= max_products:
                break

        # Limit to max_products if specified
        if max_products > 0 and len(all_urls) > max_products:
            all_urls = all_urls[:max_products]

        logger.info(f"Found {len(all_urls)} total product URLs across all categories")

        # Now scrape the product details for these URLs
        self.scrape_specific_urls(all_urls)

        return all_urls

    def save_results_template(self, output_file=None, custom_headers=None):
        """Save scraped products to a CSV file with custom headers for Zoho integration.

        Args:
            output_file (str, optional): Output filename
            custom_headers (dict, optional): Custom header mapping

        Returns:
            str: Path to the saved file
        """
        if not self.products:
            logger.warning("No products to save")
            return None

        # Generate output filename if not provided
        if not output_file:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"homedepot_results_{timestamp}.csv"

        # Determine output path
        if hasattr(self, 'is_desktop') and self.is_desktop:
            output_path = os.path.join(self.output_dir, output_file)
        else:
            # Ensure results directory exists
            results_dir = os.path.join(self.output_dir, "results")
            os.makedirs(results_dir, exist_ok=True)
            output_path = os.path.join(results_dir, output_file)

        try:
            # Define exact headers as requested for Zoho integration
            headers = [
                'Purchase Price',
                'SKU',
                'Image',
                'Manufacturer',
                'URL',
                'Sale Price',
                'Price',
                'Description',
                'Markup',
                'Item Type',
                'Item Name'
            ]

            # Write to CSV with the specified headers
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=headers)
                writer.writeheader()

                # Convert each product to the custom format
                for product in self.products:
                    row = {}

                    # Get the price value (use the same value for all price fields)
                    price_value = ''

                    # Try to get price from the product data
                    if 'price' in product and product['price']:
                        price_value = product['price']
                    # Check if price is in buybox_winner field
                    elif 'buybox_winner' in product and product['buybox_winner'] and 'price' in product['buybox_winner']:
                        price_value = product['buybox_winner']['price']

                    # If still no price, set default
                    if not price_value:
                        price_value = '0.00'

                    # Set all price fields to the same value
                    row['Purchase Price'] = price_value
                    row['Sale Price'] = price_value
                    row['Price'] = price_value

                    # Set SKU - try multiple fields to find a suitable value
                    sku = ''
                    if 'sku' in product and product['sku']:
                        sku = product['sku']
                    elif 'item_id' in product and product['item_id']:
                        sku = product['item_id']
                    elif 'model_number' in product and product['model_number']:
                        sku = product['model_number']
                    elif 'upc' in product and product['upc']:
                        sku = product['upc']

                    row['SKU'] = sku

                    # Handle images (get first image if it's a list)
                    if 'images' in product and product['images']:
                        if isinstance(product['images'], list) and len(product['images']) > 0:
                            # If it's a list, get the first image
                            image = product['images'][0]
                        else:
                            # If it's not a list, use as is
                            image = product['images']

                        # If image is a dictionary, extract the URL
                        if isinstance(image, dict) and 'link' in image:
                            row['Image'] = image['link']
                        elif isinstance(image, str):
                            row['Image'] = image
                        else:
                            row['Image'] = ''
                    else:
                        row['Image'] = ''

                    # Set manufacturer (brand)
                    if 'brand' in product and product['brand']:
                        row['Manufacturer'] = product['brand']
                    else:
                        row['Manufacturer'] = ''

                    # Set URL
                    if 'url' in product and product['url']:
                        row['URL'] = product['url']
                    else:
                        row['URL'] = ''

                    # Set description
                    if 'description' in product and product['description']:
                        row['Description'] = product['description']
                    else:
                        row['Description'] = ''

                    # Fixed markup value
                    row['Markup'] = '43%'

                    # Fixed Item Type value
                    row['Item Type'] = 'Cost of Goods Sold'

                    # Set Item Name (product name)
                    if 'name' in product and product['name']:
                        row['Item Name'] = product['name']
                    elif 'title' in product and product['title']:
                        row['Item Name'] = product['title']
                    else:
                        row['Item Name'] = ''

                    writer.writerow(row)

            logger.info(f"Saved {len(self.products)} products to {output_path} with custom headers")
            return output_path
        except Exception as e:
            logger.exception(f"Error saving results to {output_path}: {str(e)}")
            return None
