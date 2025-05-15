"""
Lowe's Scraper Module

This module provides functionality to scrape product data from Lowe's
building materials category and subcategories.
"""

import os
import json
import time
import logging
import csv
from datetime import datetime
from urllib.parse import urljoin

from .api import LowesClient
from .utils import clean_url, clean_filename, extract_product_id, convert_to_template, get_output_filename, save_to_csv_with_custom_headers
from config.lowes_settings import RAW_DATA_DIR, RESULTS_DIR, CSV_TEMPLATE, CLEAN_URLS

# Configure logging
logger = logging.getLogger(__name__)

# Set logging level to DEBUG for more detailed output
logger.setLevel(logging.DEBUG)

class LowesScraper:
    """Scraper for Lowe's product data."""

    def __init__(self, api_key, output_dir="data", max_retries=3, delay=1):
        """Initialize the scraper.

        Args:
            api_key (str): BigBox API key
            output_dir (str): Directory to store output data
            max_retries (int): Maximum number of retries for failed requests
            delay (int): Delay between API requests in seconds
        """
        self.client = LowesClient(api_key, max_retries=max_retries)
        self.output_dir = output_dir
        self.delay = delay
        self.products = []
        self.product_urls = set()  # Use a set to avoid duplicates

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Check if we're using the Desktop
        is_desktop = os.path.basename(os.path.normpath(output_dir)) == 'Desktop'
        if is_desktop:
            # For cloud environments, use a safer path
            self.output_dir = os.path.join(os.getcwd(), "data", "desktop")
            os.makedirs(self.output_dir, exist_ok=True)
            logger.info(f"Using cloud-safe path for Desktop: {self.output_dir}")

        # Create raw data and results directories
        self.raw_data_dir = os.path.join(self.output_dir, RAW_DATA_DIR)
        self.results_dir = os.path.join(self.output_dir, RESULTS_DIR)
        os.makedirs(self.raw_data_dir, exist_ok=True)
        os.makedirs(self.results_dir, exist_ok=True)

    def scrape_category(self, category_id, max_pages=5, max_products=0, sort_by=None):
        """Scrape products from a category.

        Args:
            category_id (str): Category ID to scrape
            max_pages (int): Maximum number of pages to scrape
            max_products (int): Maximum number of products to scrape (0 for all)
            sort_by (str, optional): How to sort results (e.g., 'best_seller')

        Returns:
            list: List of product URLs
        """
        logger.info(f"Scraping category: {category_id}")
        
        # Scrape each page up to max_pages
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping page {page}/{max_pages} for category '{category_id}'")

            # Add delay between requests
            if page > 1:
                time.sleep(self.delay)

            # Get category results
            try:
                # Debug: Print the category ID being used
                logger.debug(f"Using category ID: {category_id}")
                
                # Get category data
                category_data = self.client.browse_category(category_id, page=page, sort_by=sort_by)
                
                # Debug: Log the structure of the response
                logger.debug(f"Category response keys: {list(category_data.keys() if category_data else [])}")
                
                # Save raw data
                raw_data_file = os.path.join(
                    self.raw_data_dir,
                    f"category_{clean_filename(category_id)}_page_{page}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                with open(raw_data_file, 'w') as f:
                    json.dump(category_data, f, indent=2)

                # Check if we have products in the response
                if 'products' in category_data:
                    products = category_data['products']
                    logger.info(f"Found {len(products)} products on page {page}")
                    
                    for product in products:
                        try:
                            # Try to get the URL directly if available
                            if 'url' in product:
                                url = product['url']
                            # Otherwise construct it from item_id
                            elif 'item_id' in product:
                                item_id = product['item_id']
                                # Create a URL-friendly version of the title
                                title = product.get('title', 'product').replace(' ', '-').lower()
                                # Remove special characters
                                title = ''.join(c for c in title if c.isalnum() or c == '-')
                                url = f"https://www.lowes.com/pd/{title}/{item_id}"
                            else:
                                logger.warning(f"Could not extract URL from product: {product}")
                                continue
                            
                            # Add the URL to our list
                            self.product_urls.add(url)
                            logger.debug(f"Added product URL: {url}")
                        except Exception as e:
                            logger.error(f"Error extracting product URL: {str(e)}")
                else:
                    logger.warning(f"No products found on page {page} for category '{category_id}'")
                    break

                # Check if we've reached the maximum number of products
                if max_products > 0 and len(self.product_urls) >= max_products:
                    logger.info(f"Reached maximum number of products: {max_products}")
                    return list(self.product_urls)[:max_products]

                # Check if there are more pages
                if 'pagination' in category_data:
                    pagination = category_data['pagination']
                    if page >= pagination.get('total_pages', 0):
                        logger.info(f"Reached last page ({page}) for category '{category_id}'")
                        break
                elif 'products' not in category_data or len(category_data['products']) == 0:
                    logger.info(f"No more products found for category '{category_id}'")
                    break
                
            except Exception as e:
                logger.error(f"Error scraping category '{category_id}' page {page}: {str(e)}")
                break

        logger.info(f"Found {len(self.product_urls)} product URLs")
        return list(self.product_urls)

    def scrape_search_term(self, search_term, max_pages=5, max_products=0, sort_by=None):
        """Scrape products using a search term.

        Args:
            search_term (str): Search term to find products
            max_pages (int): Maximum number of pages to scrape
            max_products (int): Maximum number of products to scrape (0 for all)
            sort_by (str, optional): How to sort results (e.g., 'best_seller')

        Returns:
            list: List of product URLs
        """
        logger.info(f"Scraping search term: {search_term}")
        
        # Scrape each page up to max_pages
        for page in range(1, max_pages + 1):
            logger.info(f"Scraping page {page}/{max_pages} for term '{search_term}'")

            # Add delay between requests
            if page > 1:
                time.sleep(self.delay)

            # Get search results
            try:
                search_data = self.client.search_products(search_term, page=page, sort_by=sort_by)

                # Save raw data
                raw_data_file = os.path.join(
                    self.raw_data_dir,
                    f"search_{clean_filename(search_term)}_page_{page}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                with open(raw_data_file, 'w') as f:
                    json.dump(search_data, f, indent=2)

                # Extract product URLs
                new_urls = self.extract_product_urls(search_data)
                logger.info(f"Found {len(new_urls)} product URLs on page {page}")
                
                # Check if we've reached the maximum number of products
                if max_products > 0 and len(self.product_urls) >= max_products:
                    logger.info(f"Reached maximum number of products: {max_products}")
                    return list(self.product_urls)[:max_products]

                # Check if there are more pages
                if 'pagination' in search_data:
                    pagination = search_data['pagination']
                    if page >= pagination.get('total_pages', 0):
                        logger.info(f"Reached last page ({page}) for term '{search_term}'")
                        break
                elif len(new_urls) == 0:
                    logger.info(f"No products found on page {page}, stopping pagination")
                    break
                
            except Exception as e:
                logger.error(f"Error scraping search term '{search_term}' page {page}: {str(e)}")
                break

        logger.info(f"Found total of {len(self.product_urls)} product URLs")
        return list(self.product_urls)

    def extract_product_urls(self, search_data):
        """Extract product URLs from search results.
        
        Args:
            search_data (dict): Search results data
        
        Returns:
            list: List of product URLs
        """
        product_urls = []
        
        if 'search_results' in search_data:
            search_results = search_data['search_results']
            logger.info(f"Processing {len(search_results)} search results")
            
            for result in search_results:
                try:
                    if 'product' in result:
                        product = result['product']
                        
                        # Try to get the URL directly if available
                        if 'url' in product:
                            url = product['url']
                        # Otherwise construct it from item_id
                        elif 'item_id' in product:
                            item_id = product['item_id']
                            # Create a URL-friendly version of the title
                            title = product.get('title', 'product').replace(' ', '-').lower()
                            # Remove special characters
                            title = ''.join(c for c in title if c.isalnum() or c == '-')
                            url = f"https://www.lowes.com/pd/{title}/{item_id}"
                        else:
                            logger.warning(f"Could not extract URL from product: {product}")
                            continue
                        
                        # Add the URL to our list
                        product_urls.append(url)
                        self.product_urls.add(url)
                        logger.debug(f"Added product URL: {url}")
                except Exception as e:
                    logger.error(f"Error extracting product URL: {str(e)}")
                
        logger.info(f"Extracted {len(product_urls)} product URLs")
        return product_urls

    def scrape_specific_urls(self, urls, max_products=0):
        """Scrape specific product URLs.

        Args:
            urls (list): List of product URLs
            max_products (int): Maximum number of products to scrape (0 for all)

        Returns:
            list: List of product URLs
        """
        logger.info(f"Scraping {len(urls)} specific URLs")

        # Add URLs to the set
        for url in urls:
            if CLEAN_URLS:
                url = clean_url(url)
            self.product_urls.add(url)

            # Check if we've reached the maximum number of products
            if max_products > 0 and len(self.product_urls) >= max_products:
                logger.info(f"Reached maximum number of products: {max_products}")
                break

        return list(self.product_urls)[:max_products] if max_products > 0 else list(self.product_urls)

    def fetch_product_details(self, callback=None):
        """Fetch detailed product information for all collected URLs.

        Args:
            callback (function, optional): Callback function to report progress

        Returns:
            list: List of product details
        """
        from .utils import is_optimal_time, wait_for_optimal_time

        logger.info(f"Fetching details for {len(self.product_urls)} products")
        self.products = []

        # Check if we're in optimal time for API requests
        if not is_optimal_time():
            logger.info("Current time is outside optimal hours. Waiting for optimal time...")
            wait_for_optimal_time(max_wait_minutes=30)

        # Convert set to list for iteration with index
        urls = list(self.product_urls)

        for i, url in enumerate(urls):
            logger.info(f"Fetching product {i+1}/{len(urls)}: {url}")

            # Report progress if callback is provided
            if callback:
                callback(i, len(urls), f"Fetching product {i+1}/{len(urls)}")

            # Add delay between requests
            if i > 0:
                time.sleep(self.delay)

            try:
                # Get product data
                product_data = self.client.get_product_by_url(url)

                # Save raw data
                product_id = extract_product_id(url)
                raw_data_file = os.path.join(
                    self.raw_data_dir,
                    f"product_{product_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                )
                with open(raw_data_file, 'w') as f:
                    json.dump(product_data, f, indent=2)

                # Add to products list
                if 'product' in product_data:
                    product = product_data['product']
                    product['url'] = url  # Ensure URL is included
                    self.products.append(product)
                else:
                    logger.warning(f"No product data found for URL: {url}")
            except Exception as e:
                logger.error(f"Error fetching product details for URL {url}: {str(e)}")

        logger.info(f"Fetched details for {len(self.products)} products")
        return self.products

    def save_results(self, format="csv", output_file=None, custom_headers=None):
        """Save scraped product data to a file.

        Args:
            format (str): Output format ('csv' or 'json')
            output_file (str, optional): Custom output filename
            custom_headers (dict, optional): Custom CSV headers mapping

        Returns:
            str: Path to the saved file
        """
        if not self.products:
            logger.warning("No products to save")
            return None

        # Generate output filename if not provided
        if not output_file:
            output_file = get_output_filename(self.results_dir, format)

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        if format.lower() == 'csv':
            # Import standard headers
            from config.lowes_settings import STANDARD_CSV_HEADERS
            
            # Use custom headers if provided, otherwise use standard headers
            headers_to_use = custom_headers if custom_headers else STANDARD_CSV_HEADERS
            
            # Save as CSV with the appropriate headers
            return save_to_csv_with_custom_headers(self.products, output_file, headers_to_use)
        else:
            # Save as JSON
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.products, f, indent=2)

        logger.info(f"Saved {len(self.products)} products to {output_file}")
        return output_file

    def save_results_template(self, output_file=None):
        """Save scraped product data to a CSV file using the template format.

        Args:
            output_file (str, optional): Custom output filename

        Returns:
            str: Path to the saved file
        """
        if not self.products:
            logger.warning("No products to save")
            return None

        # Generate output filename if not provided
        if not output_file:
            output_file = get_output_filename(self.results_dir, 'csv', suffix='_template')

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_file), exist_ok=True)

        # Convert products to template format
        template_products = []
        for product in self.products:
            try:
                template_product = convert_to_template(product, CSV_TEMPLATE)
                template_products.append(template_product)
                logger.debug(f"Converted product: {template_product.get('product_name', 'Unknown')}")
            except Exception as e:
                logger.error(f"Error converting product to template: {str(e)}")

        # Save as CSV
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_TEMPLATE['headers'])
            writer.writeheader()
            writer.writerows(template_products)

        logger.info(f"Saved {len(template_products)} products to template CSV: {output_file}")
        return output_file
