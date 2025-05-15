#!/usr/bin/env python3
"""
Script to scrape specific Home Depot product URLs.
"""

import os
import csv
import time
import logging
import argparse
import threading
import signal
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional

from homedepot_scraper.api import HomeDepotClient
from homedepot_scraper.scraper import HomeDepotScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"specific_products_scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Global variables for tracking the scraping process
stop_requested = False
is_scraping = False
current_progress = {
    'current': 0,
    'total': 0,
    'percentage': 0,
    'status': 'idle',
    'message': 'Ready to start',
    'last_saved': None
}

# Lock for thread-safe access to the progress data
progress_lock = threading.Lock()

def update_progress(current: int, total: int, message: str = None):
    """Update the progress information.

    Args:
        current: Current number of items processed
        total: Total number of items to process
        message: Optional status message
    """
    with progress_lock:
        current_progress['current'] = current
        current_progress['total'] = total
        current_progress['percentage'] = int((current / total) * 100) if total > 0 else 0
        if message:
            current_progress['message'] = message

        # Print progress to console
        percentage = current_progress['percentage']
        progress_bar = f"[{'=' * (percentage // 2)}{' ' * (50 - (percentage // 2))}] {percentage}%"
        print(f"\r{progress_bar} {current}/{total} - {message or ''}", end='', flush=True)

def show_confirmation_dialog(message="Do you want to stop the scraper and save current results?"):
    """Show a confirmation dialog to the user.

    Args:
        message: The message to display

    Returns:
        bool: True if the user confirmed, False otherwise
    """
    while True:
        response = input(f"\n{message} (y/n): ").strip().lower()
        if response in ['y', 'yes']:
            return True
        elif response in ['n', 'no']:
            return False
        print("Please enter 'y' or 'n'")

def request_stop(confirm=True):
    """Request to stop the scraping process.

    Args:
        confirm: Whether to show a confirmation dialog

    Returns:
        bool: True if the stop was confirmed, False otherwise
    """
    global stop_requested

    # If confirmation is required, show the dialog
    if confirm:
        if not show_confirmation_dialog():
            logger.info("Stop request canceled by user")
            return False

    # Set the stop flag
    stop_requested = True
    with progress_lock:
        current_progress['status'] = 'stopping'
        current_progress['message'] = 'Stop requested. Saving current results...'
    logger.info("Stop requested by user. Will save current results before exiting.")
    return True

def handle_interrupt(signum, frame):
    """Handle keyboard interrupt (Ctrl+C).

    Args:
        signum: Signal number (unused)
        frame: Current stack frame (unused)
    """
    global stop_requested

    if not stop_requested:
        print("\nInterrupt received.")
        # Get the confirm_stop argument from the command line
        args = parse_args()
        if args.confirm_stop:
            if not request_stop(confirm=True):
                print("Continuing scraping...")
                return
        else:
            request_stop(confirm=False)
    else:
        print("\nSecond interrupt received. Forcing exit without saving...")
        sys.exit(1)

# Register the signal handler for keyboard interrupt
signal.signal(signal.SIGINT, handle_interrupt)

def save_partial_results(scraper, output_dir, prefix="partial"):
    """Save the current results to a CSV file.

    Args:
        scraper: The HomeDepotScraper instance
        output_dir: Directory to save the results
        prefix: Prefix for the output filename

    Returns:
        str: Path to the saved file, or None if no products were saved
    """
    if not scraper.products:
        logger.warning("No products to save")
        return None

    # Generate output filename
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_file = f"{prefix}_results_{timestamp}.csv"

    # Ensure results directory exists
    results_dir = os.path.join(output_dir, 'results')
    os.makedirs(results_dir, exist_ok=True)
    output_path = os.path.join(results_dir, output_file)

    try:
        # Define exact headers as requested
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
            for product in scraper.products:
                row = {}

                # Get the price value (use the same value for all price fields)
                price_value = ''

                # Try to get price from product data
                if 'price' in product and product['price']:
                    price_value = product['price']
                else:
                    # Default price if not available
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
                else:
                    row['Item Name'] = ''

                writer.writerow(row)

        logger.info(f"Saved {len(scraper.products)} products to {output_path}")

        # Update progress with last saved information
        with progress_lock:
            current_progress['last_saved'] = {
                'file': output_file,
                'path': output_path,
                'count': len(scraper.products),
                'time': timestamp
            }

        return output_path
    except Exception as e:
        logger.exception(f"Error saving partial results: {str(e)}")
        return None

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Home Depot Specific Products Scraper")

    parser.add_argument('--api-key', required=True, help='BigBox API key')
    parser.add_argument('--urls-file', default='product_urls.txt', help='File containing product URLs')
    parser.add_argument('--output-dir', default='data', help='Output directory for scraped data')
    parser.add_argument('--format', choices=['json', 'csv'], default='csv', help='Output format')
    parser.add_argument('--delay', type=float, default=1.5, help='Delay between API requests in seconds')
    parser.add_argument('--max-products', type=int, default=0, help='Maximum number of products to scrape (0 for all)')
    parser.add_argument('--auto-save-interval', type=int, default=10, help='Auto-save results every N products (0 to disable)')
    parser.add_argument('--confirm-stop', action='store_true', help='Show confirmation dialog when stopping')
    parser.add_argument('--debug', action='store_true', help='Enable debug logging')

    return parser.parse_args()

def load_urls(file_path):
    """Load product URLs from a file."""
    try:
        with open(file_path, 'r') as f:
            urls = [line.strip() for line in f if line.strip()]
            # Remove duplicates while preserving order
            unique_urls = []
            seen = set()
            for url in urls:
                if url not in seen:
                    seen.add(url)
                    unique_urls.append(url)
            return unique_urls
    except Exception as e:
        logger.error(f"Failed to load URLs from file: {str(e)}")
        return []

def extract_product_id(url):
    """Extract product ID from URL."""
    try:
        # URLs are in format: https://www.homedepot.com/p/product-name/PRODUCT_ID
        parts = url.strip('/').split('/')
        return parts[-1]
    except Exception:
        return None

def main():
    """Main entry point for the script."""
    global is_scraping, stop_requested

    args = parse_args()

    # Set debug logging if requested
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)

    logger.info("Starting Home Depot Specific Products Scraper")

    # Update progress status
    with progress_lock:
        current_progress['status'] = 'initializing'
        current_progress['message'] = 'Loading URLs...'

    # Load product URLs
    urls = load_urls(args.urls_file)
    if not urls:
        logger.error("No URLs found in the input file")
        with progress_lock:
            current_progress['status'] = 'error'
            current_progress['message'] = 'No URLs found in the input file'
        return 1

    # Apply max_products limit if specified
    if args.max_products > 0 and len(urls) > args.max_products:
        logger.info(f"Limiting to {args.max_products} URLs out of {len(urls)}")
        urls = urls[:args.max_products]

    logger.info(f"Loaded {len(urls)} product URLs")

    # Update progress with total URLs
    update_progress(0, len(urls), "Initializing scraper...")

    try:
        # Initialize the scraper
        scraper = HomeDepotScraper(
            api_key=args.api_key,
            output_dir=args.output_dir,
            delay=args.delay
        )

        # Set scraping flag
        is_scraping = True
        with progress_lock:
            current_progress['status'] = 'running'

        # Process each URL
        last_save_count = 0
        for i, url in enumerate(urls, 1):
            # Check if stop was requested
            if stop_requested:
                logger.info("Stopping scraper as requested")
                break

            # Update progress
            update_progress(i-1, len(urls), f"Processing URL {i}/{len(urls)}: {url}")
            logger.info(f"Processing URL {i}/{len(urls)}: {url}")

            # Extract product ID from URL
            product_id = extract_product_id(url)
            if not product_id:
                logger.error(f"Could not extract product ID from URL: {url}")
                continue

            try:
                # Fetch product details using URL
                product_data = scraper.client.get_product_by_url(url)

                if not product_data:
                    logger.error(f"Failed to fetch details for URL: {url}")
                    continue

                # Save raw product data
                scraper._save_raw_data(f"product_{product_id}.json", product_data)

                # Process product data
                if 'product' in product_data:
                    # Get features and ensure it's a list
                    features = product_data['product'].get('features', [])
                    if features is None:
                        features = []
                    elif not isinstance(features, list):
                        features = [str(features)]

                    # Get specifications and ensure it's a dict
                    specs = product_data['product'].get('specifications', {})
                    if specs is None:
                        specs = {}

                    # Get price from the buybox_winner field
                    price = '0.00'
                    if 'buybox_winner' in product_data['product'] and product_data['product']['buybox_winner']:
                        buybox = product_data['product']['buybox_winner']
                        if 'price' in buybox and buybox['price']:
                            price = buybox['price']

                    product_info = {
                        'url': url,
                        'item_id': product_id,
                        'name': product_data['product'].get('title'),
                        'brand': product_data['product'].get('brand'),
                        'price': price,
                        'currency': product_data['product'].get('currency'),
                        'description': product_data['product'].get('description'),
                        'specifications': specs,
                        'features': features,
                        'images': product_data['product'].get('images'),
                        'rating': product_data['product'].get('rating'),
                        'ratings_total': product_data['product'].get('ratings_total'),
                        'model_number': product_data['product'].get('model_number'),
                        'upc': product_data['product'].get('upc')
                    }

                    # Add to products list
                    scraper.products.append(product_info)
                    logger.info(f"Successfully scraped product: {product_info.get('name', product_id)}")

                    # Auto-save if interval is reached
                    if args.auto_save_interval > 0 and len(scraper.products) >= last_save_count + args.auto_save_interval:
                        update_progress(i, len(urls), f"Auto-saving {len(scraper.products)} products...")
                        save_partial_results(scraper, args.output_dir, "autosave")
                        last_save_count = len(scraper.products)
                        update_progress(i, len(urls), f"Continuing with URL {i+1}/{len(urls)}")
                else:
                    logger.error(f"Failed to extract details for URL: {url}")

                # Add delay between requests
                time.sleep(args.delay)

            except Exception as e:
                logger.error(f"Error processing URL {url}: {str(e)}")

            # Update progress after processing this URL
            update_progress(i, len(urls), f"Processed {i}/{len(urls)} URLs")

        # Update status based on whether we stopped early or completed
        if stop_requested:
            with progress_lock:
                current_progress['status'] = 'stopped'
                current_progress['message'] = 'Scraping stopped by user. Saving results...'
            logger.info("Scraping stopped by user request")
        else:
            with progress_lock:
                current_progress['status'] = 'completed'
                current_progress['message'] = 'Scraping completed. Saving results...'
            logger.info("Scraping completed successfully")

        # Save results
        if scraper.products:
            update_progress(len(urls), len(urls), f"Saving {len(scraper.products)} products...")

            # Save results to CSV with specific headers
            # Use the save_partial_results function to save the final results
            output_path = save_partial_results(scraper, args.output_dir, "final" if stop_requested else "homedepot")

            if output_path:
                logger.info(f"Saved {len(scraper.products)} products to {output_path}")
                with progress_lock:
                    current_progress['message'] = f"Saved {len(scraper.products)} products to {os.path.basename(output_path)}"
            else:
                logger.warning("Failed to save results")
                with progress_lock:
                    current_progress['message'] = "Failed to save results"
        else:
            logger.warning("No products were successfully scraped")
            with progress_lock:
                current_progress['message'] = "No products were successfully scraped"

        # Reset scraping flag
        is_scraping = False
        stop_requested = False

        # Final progress update
        with progress_lock:
            current_progress['status'] = 'idle'

        logger.info("Scraping process finished")
        return 0

    except Exception as e:
        logger.exception(f"Error during scraping: {str(e)}")

        # Update progress with error
        with progress_lock:
            current_progress['status'] = 'error'
            current_progress['message'] = f"Error: {str(e)}"

        # Reset flags
        is_scraping = False
        stop_requested = False

        return 1

def start_progress_ui():
    """Start the progress UI if available."""
    try:
        import progress_ui
        return progress_ui.start_progress_ui()
    except ImportError:
        logger.warning("Progress UI not available. Run without visual progress tracking.")
        return None

if __name__ == "__main__":
    # Start the progress UI
    server = start_progress_ui()

    try:
        # Run the main scraper
        exit_code = main()

        # Keep the server running if there are results to download
        if server and current_progress.get('last_saved'):
            print("\nProgress UI is still running at http://localhost:8000")
            print("You can download the results from there.")
            print("Press Ctrl+C to exit.")

            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nExiting...")

        exit(exit_code)
    except KeyboardInterrupt:
        print("\nExiting...")
        exit(1)
