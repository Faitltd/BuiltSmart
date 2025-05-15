#!/usr/bin/env python3
"""
Weekly Building Supplies Scraper

This script automates the weekly scraping of all Home Depot building supplies products
and exports the data to CSV. It combines category browsing to discover products with
detailed product information extraction.

Usage:
    python3 weekly_building_supplies_scraper.py
"""

import argparse
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
import re

# Default API key
DEFAULT_API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"

# Building supplies category ID
BUILDING_SUPPLIES_CATEGORY_ID = "N-5yc1vZaqns"

# Output directory
DEFAULT_OUTPUT_DIR = "building_supplies_data"

def log(message):
    """Print a timestamped log message."""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")
    sys.stdout.flush()  # Ensure logs are written immediately

class BuildingSuppliesScraper:
    """Scrapes all building supplies products from Home Depot."""
    
    def __init__(self, api_key=DEFAULT_API_KEY, output_dir=DEFAULT_OUTPUT_DIR, max_pages=None, max_products=None):
        """Initialize the scraper with API key and output parameters."""
        self.api_key = api_key
        self.output_dir = output_dir
        self.max_pages = max_pages
        self.max_products = max_products
        self.products_scraped = 0
        self.all_products = []
        self.product_urls = []
        
        # Create output directory if it doesn't exist
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            log(f"Created output directory: {output_dir}")
    
    def scrape_category(self):
        """Scrape all products in the building supplies category."""
        log(f"Starting scraper for Building Supplies category (ID: {BUILDING_SUPPLIES_CATEGORY_ID})")
        
        # Get the first page to determine total number of pages
        page = 1
        first_page_data = self._fetch_category_page(page)
        
        if not first_page_data:
            log("Failed to fetch first page. Aborting.")
            return []
        
        # Parse total number of pages and products
        pagination = first_page_data.get('pagination', {})
        total_pages = pagination.get('total_pages', 1)
        total_products = pagination.get('total_results', 0)
        
        if self.max_pages and self.max_pages < total_pages:
            total_pages = self.max_pages
            
        log(f"Found {total_products} products across {total_pages} pages")
        
        # Extract product URLs from the first page
        self._extract_product_urls(first_page_data)
        
        # Loop through remaining pages
        for page in range(2, total_pages + 1):
            if self.max_products and self.products_scraped >= self.max_products:
                log(f"Reached maximum number of products: {self.max_products}")
                break
                
            log(f"Processing page {page}")
            page_data = self._fetch_category_page(page)
            
            if not page_data:
                log(f"Failed to fetch page {page}. Skipping.")
                continue
                
            self._extract_product_urls(page_data)
            
            # Save URLs periodically
            if page % 10 == 0 or page == total_pages:
                self._save_urls()
        
        # Final save of URLs
        self._save_urls()
        log(f"Completed scraping category. Found {len(self.product_urls)} product URLs")
        return self.product_urls
        
    def _fetch_category_page(self, page):
        """Fetch a single page of the category listings."""
        params = {
            'api_key': self.api_key,
            'type': 'category',
            'category_id': BUILDING_SUPPLIES_CATEGORY_ID,
            'page': page
        }
        
        query_string = urllib.parse.urlencode(params)
        api_url = f"https://api.bigboxapi.com/request?{query_string}"
        
        log(f"Requesting: {api_url}")
        
        try:
            with urllib.request.urlopen(api_url) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Check if request was successful
                if not data.get('request_info', {}).get('success', False):
                    log(f"API request failed: {data.get('request_info', {}).get('message', 'Unknown error')}")
                    return None
                
                # Save raw page data for debugging
                with open(os.path.join(self.output_dir, f"page_{page}.json"), 'w') as f:
                    json.dump(data, f, indent=2)
                    
                return data
        except Exception as e:
            log(f"Error fetching category page {page}: {str(e)}")
            return None
    
    def _extract_product_urls(self, page_data):
        """Extract product URLs from category page data."""
        products = page_data.get('category_results', [])
        log(f"Found {len(products)} products on this page")
        
        for product in products:
            if self.max_products and self.products_scraped >= self.max_products:
                break
                
            # Extract product URL
            url = product.get('link')
            if url:
                self.product_urls.append(url)
                self.products_scraped += 1
    
    def _save_urls(self):
        """Save the list of product URLs to a file."""
        urls_file = os.path.join(self.output_dir, "product_urls.txt")
        with open(urls_file, 'w') as f:
            for url in self.product_urls:
                f.write(f"{url}\n")
        log(f"Saved {len(self.product_urls)} product URLs to {urls_file}")

class ProductDetailExtractor:
    """Extracts detailed information for each product."""
    
    def __init__(self, api_key=DEFAULT_API_KEY, output_dir=DEFAULT_OUTPUT_DIR):
        """Initialize the extractor with API key and output directory."""
        self.api_key = api_key
        self.output_dir = output_dir
        self.products = []
        
        # Fields for CSV
        self.fieldnames = [
            'product_name', 'sku', 'item_id', 'model_number', 'upc',
            'url', 'price', 'currency', 'unit', 'details', 'specifications'
        ]
    
    def extract_products(self, product_urls):
        """Extract details for a list of product URLs."""
        log(f"Starting extraction of {len(product_urls)} products")
        success_count = 0
        
        for i, url in enumerate(product_urls):
            if i % 10 == 0:
                log(f"Processing product {i+1} of {len(product_urls)}")
            
            product_info = self.extract_product_info(url)
            
            if product_info:
                self.products.append(product_info)
                success_count += 1
                
                # Periodically save results
                if success_count % 50 == 0:
                    self.save_to_csv()
            
            # Pause between requests to avoid overloading the API
            if i < len(product_urls) - 1:
                time.sleep(1)
        
        # Final save
        self.save_to_csv()
        log(f"Successfully extracted details for {success_count} products")
        return success_count
    
    def extract_product_info(self, url):
        """Extract information for a single product."""
        params = {
            'api_key': self.api_key,
            'type': 'product',
            'url': url
        }
        
        query_string = urllib.parse.urlencode(params)
        api_url = f"https://api.bigboxapi.com/request?{query_string}"
        
        try:
            with urllib.request.urlopen(api_url) as response:
                data = json.loads(response.read().decode('utf-8'))
                
                # Check if request was successful
                if not data.get('request_info', {}).get('success', False):
                    log(f"API request failed for {url}: {data.get('request_info', {}).get('message', 'Unknown error')}")
                    return None
                
                # Get product info
                product = data.get('product', {})
                if not product:
                    log(f"No product data found for {url}")
                    return None
                
                # Extract relevant fields
                result = {
                    'product_name': product.get('title', 'N/A'),
                    'sku': product.get('store_sku', 'N/A'),
                    'item_id': product.get('item_id', 'N/A'),
                    'model_number': product.get('model_number', 'N/A'),
                    'upc': product.get('upc', 'N/A'),
                    'url': url,
                    'price': 'N/A',
                    'currency': 'N/A',
                    'unit': 'N/A',
                    'details': product.get('description', 'N/A'),
                }
                
                # Extract price information
                buybox = product.get('buybox_winner', {})
                if buybox:
                    result['price'] = buybox.get('price', 'N/A')
                    result['currency'] = buybox.get('currency_symbol', '$') + " " + buybox.get('currency', 'USD')
                    result['unit'] = buybox.get('unit', 'each')
                
                # Try to find more detailed specifications
                specs = []
                for spec in product.get('specifications', []):
                    specs.append(f"{spec.get('name', '')}: {spec.get('value', '')}")
                
                if specs:
                    result['specifications'] = " | ".join(specs)
                else:
                    result['specifications'] = 'N/A'
                
                # Save detailed product data to JSON file
                item_id = product.get('item_id', 'unknown')
                with open(os.path.join(self.output_dir, f"product_{item_id}.json"), 'w') as f:
                    json.dump(data, f, indent=2)
                
                return result
        
        except Exception as e:
            log(f"Error extracting product info for {url}: {str(e)}")
            return None
    
    def save_to_csv(self):
        """Save product data to CSV file."""
        if not self.products:
            log("No products to save")
            return
        
        # Generate date-stamped filename
        today = datetime.now().strftime("%Y-%m-%d")
        csv_file = os.path.join(self.output_dir, f"building_supplies_{today}.csv")
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=self.fieldnames)
            writer.writeheader()
            for product in self.products:
                writer.writerow(product)
        
        log(f"Saved {len(self.products)} products to {csv_file}")
        
        # Also save all products to a JSON file
        json_file = os.path.join(self.output_dir, f"building_supplies_{today}.json")
        with open(json_file, 'w') as f:
            json.dump(self.products, f, indent=2)
        
        log(f"Saved JSON backup to {json_file}")

def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(description="Weekly Home Depot Building Supplies Scraper")
    
    parser.add_argument('--api-key', default=DEFAULT_API_KEY, help='BigBox API key')
    parser.add_argument('--output-dir', default=DEFAULT_OUTPUT_DIR, help='Output directory for scraped data')
    parser.add_argument('--max-pages', type=int, help='Maximum number of pages to scrape')
    parser.add_argument('--max-products', type=int, help='Maximum number of products to scrape')
    parser.add_argument('--skip-category', action='store_true', help='Skip category scraping and use existing URLs')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    if not os.path.exists(args.output_dir):
        os.makedirs(args.output_dir)
    
    start_time = time.time()
    log("Starting weekly building supplies scraper")
    
    product_urls = []
    
    # Step 1: Scrape category for product URLs (unless skipped)
    if not args.skip_category:
        scraper = BuildingSuppliesScraper(
            api_key=args.api_key,
            output_dir=args.output_dir,
            max_pages=args.max_pages,
            max_products=args.max_products
        )
        product_urls = scraper.scrape_category()
    else:
        # Use existing URLs file
        urls_file = os.path.join(args.output_dir, "product_urls.txt")
        if os.path.exists(urls_file):
            with open(urls_file, 'r') as f:
                product_urls = [line.strip() for line in f if line.strip()]
            log(f"Loaded {len(product_urls)} product URLs from {urls_file}")
        else:
            log(f"No product URLs file found at {urls_file}")
            return 1
    
    # Step 2: Extract product details
    extractor = ProductDetailExtractor(
        api_key=args.api_key,
        output_dir=args.output_dir
    )
    extractor.extract_products(product_urls)
    
    # Log completion time
    elapsed_time = time.time() - start_time
    log(f"Weekly scraping completed in {elapsed_time:.2f} seconds")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
