#!/usr/bin/env python3
"""
Combined scraper for Home Depot and Lowe's building materials.
"""

import os
import sys
import logging
import argparse
import json
import time
import random
import traceback
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional

# Import the scrapers
from homedepot_scraper.xpath_utils import XPathScraper
from lowes_scraper.scraper import LowesScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper_log.txt', mode='a')
    ]
)

logger = logging.getLogger(__name__)

# User agent list for rotation
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
]

def get_random_user_agent():
    """Get a random user agent from the list."""
    return random.choice(USER_AGENTS)

def get_random_delay(min_delay=1.0, max_delay=3.0):
    """Get a random delay between min_delay and max_delay."""
    return min_delay + random.random() * (max_delay - min_delay)

class CombinedScraper:
    """Combined scraper for Home Depot and Lowe's."""
    
    def __init__(self, 
                 hd_api_key=None, 
                 lowes_api_key=None, 
                 output_dir="data",
                 max_retries=3, 
                 min_delay=1.0, 
                 max_delay=3.0):
        """Initialize the combined scraper."""
        self.output_dir = output_dir
        self.max_retries = max_retries
        self.min_delay = min_delay
        self.max_delay = max_delay
        
        # Create output directory if it doesn't exist
        try:
            os.makedirs(output_dir, exist_ok=True)
            logger.info(f"Output directory set to: {os.path.abspath(output_dir)}")
        except Exception as e:
            logger.error(f"Failed to create output directory: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Initialize the Home Depot scraper
        try:
            self.hd_api_key = hd_api_key or os.environ.get('HD_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6')
            logger.info(f"Using Home Depot API key: {self.hd_api_key[:5]}...{self.hd_api_key[-5:] if self.hd_api_key else 'None'}")
            self.hd_scraper = XPathScraper(user_agent=get_random_user_agent())
            logger.info("Home Depot scraper initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Home Depot scraper: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Initialize the Lowe's scraper
        try:
            self.lowes_api_key = lowes_api_key or os.environ.get('LOWES_API_KEY', 'D302834B9CC3400FA921A2F2D384ADD6')
            logger.info(f"Using Lowe's API key: {self.lowes_api_key[:5]}...{self.lowes_api_key[-5:] if self.lowes_api_key else 'None'}")
            
            self.lowes_scraper = LowesScraper(
                api_key=self.lowes_api_key,
                output_dir=output_dir,
                max_retries=max_retries,
                delay=min_delay
            )
            logger.info("Lowe's scraper initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Lowe's scraper: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Store results
        self.hd_products = []
        self.lowes_products = []
    
#!/usr/bin/env python3
"""
Combined scraper for Home Depot and Lowe's building materials.
"""

import os
import sys
import logging
import argparse
import json
import time
import random
import traceback
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional

# Import the scrapers
from homedepot_scraper.xpath_utils import XPathScraper
from lowes_scraper.scraper import LowesScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('scraper_log.txt', mode='a')
    ]
)

logger = logging.getLogger(__name__)

# User agent list for rotation
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
]

def get_random_user_agent():
    """Get a random user agent from the list."""
    return random.choice(USER_AGENTS)

def get_random_delay(min_delay=1.0, max_delay=3.0):
    """Get a random delay between min_delay and max_delay."""
    return min_delay + random.random() * (max_delay - min_delay)

class CombinedScraper:
    """Combined scraper for Home Depot and Lowe's."""
    
    def __init__(self, 
                 hd_api_key=None, 
                 lowes_api_key=None, 
                 output_dir="data",
                 max_retries=3, 
                 min_delay=1.0, 
                 max_delay=3.0):
        """Initialize the combined scraper."""
        self.output_dir = output_dir
        self.max_retries = max_retries
        self.min_delay = min_delay
        self.max_delay = max_delay
        
        # Create output directory if it doesn't exist
        try:
            os.makedirs(output_dir, exist_ok=True)
            logger.info(f"Output directory set to: {os.path.abspath(output_dir)}")
        except Exception as e:
            logger.error(f"Failed to create output directory: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Initialize the Home Depot scraper
        try:
            self.hd_api_key = hd_api_key or os.environ.get('HD_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6')
            logger.info(f"Using Home Depot API key: {self.hd_api_key[:5]}...{self.hd_api_key[-5:] if self.hd_api_key else 'None'}")
            self.hd_scraper = XPathScraper(user_agent=get_random_user_agent())
            logger.info("Home Depot scraper initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Home Depot scraper: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Initialize the Lowe's scraper
        try:
            self.lowes_api_key = lowes_api_key or os.environ.get('LOWES_API_KEY', 'D302834B9CC3400FA921A2F2D384ADD6')
            logger.info(f"Using Lowe's API key: {self.lowes_api_key[:5]}...{self.lowes_api_key[-5:] if self.lowes_api_key else 'None'}")
            
            self.lowes_scraper = LowesScraper(
                api_key=self.lowes_api_key,
                output_dir=output_dir,
                max_retries=max_retries,
                delay=min_delay
            )
            logger.info("Lowe's scraper initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Lowe's scraper: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
        # Store results
        self.hd_products = []
        self.lowes_products = []
    
    def scrape_home_depot(self, urls=None, category_id=None, search_term=None, max_products=0):
        """Scrape Home Depot products."""
        logger.info("Starting Home Depot scraper...")
        
        if not urls and not search_term:
            logger.warning("No Home Depot URLs or search term provided. Skipping Home Depot scraping.")
            return []
        
        if urls:
            logger.info(f"Scraping {len(urls)} specific Home Depot URLs")
            successful_scrapes = 0
            failed_scrapes = 0
            
            for i, url in enumerate(urls[:max_products] if max_products > 0 else urls):
                try:
                    logger.info(f"Scraping Home Depot product {i+1}/{len(urls)}: {url}")
                    
                    # Try multiple times with increasing delays
                    product_data = None
                    for attempt in range(1, self.max_retries + 1):
                        try:
                            product_data = self.hd_scraper.extract_product_data(url)
                            if product_data:
                                break
                            logger.warning(f"Attempt {attempt}/{self.max_retries} failed to get data from {url}")
                            time.sleep(get_random_delay(self.min_delay * attempt, self.max_delay * attempt))
                        except Exception as e:
                            logger.warning(f"Attempt {attempt}/{self.max_retries} failed with error: {str(e)}")
                            if attempt < self.max_retries:
                                time.sleep(get_random_delay(self.min_delay * attempt, self.max_delay * attempt))
                    
                    if product_data:
                        self.hd_products.append(product_data)
                        successful_scrapes += 1
                        logger.info(f"Successfully scraped product: {product_data.get('title', 'Unknown')}")
                        # Log some product details for debugging
                        logger.debug(f"Product data: {json.dumps(product_data, indent=2)}")
                    else:
                        failed_scrapes += 1
                        logger.error(f"Failed to scrape product data from {url} after {self.max_retries} attempts")
                    
                    # Add a random delay to avoid detection
                    delay = get_random_delay(self.min_delay, self.max_delay)
                    logger.debug(f"Waiting {delay:.2f} seconds before next request")
                    time.sleep(delay)
                    
                except Exception as e:
                    failed_scrapes += 1
                    logger.error(f"Error scraping Home Depot product {url}: {str(e)}")
                    logger.error(traceback.format_exc())
            
            logger.info(f"Home Depot scraper completed. Scraped {len(self.hd_products)} products.")
            if len(urls) > 0:
                logger.info(f"Success rate: {successful_scrapes}/{len(urls)} ({successful_scrapes/len(urls)*100:.1f}%)")
        
        # Save intermediate results in case of partial success
        if self.hd_products:
            try:
                temp_file = os.path.join(self.output_dir, f"temp_homedepot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
                with open(temp_file, 'w', encoding='utf-8') as f:
                    json.dump(self.hd_products, f, indent=2)
                logger.info(f"Saved intermediate Home Depot results to {temp_file}")
            except Exception as e:
                logger.error(f"Failed to save intermediate results: {str(e)}")
        
        return self.hd_products
    
    def scrape_lowes(self, urls=None, category_id=None, search_term=None, max_pages=5, max_products=0):
        """Scrape Lowe's products."""
        logger.info("Starting Lowe's scraper...")
        
        try:
            product_urls = []
            
            if urls:
                logger.info(f"Scraping {len(urls)} specific Lowe's URLs")
                product_urls = self.lowes_scraper.scrape_specific_urls(urls, max_products=max_products)
                logger.info(f"Found {len(product_urls)} Lowe's product URLs from specific URLs")
            elif category_id:
                logger.info(f"Scraping Lowe's category: {category_id}")
                product_urls = self.lowes_scraper.scrape_category(
                    category_id=category_id,
                    max_pages=max_pages,
                    max_products=max_products
                )
                logger.info(f"Found {len(product_urls)} Lowe's product URLs from category {category_id}")
            elif search_term:
                logger.info(f"Scraping Lowe's search term: {search_term}")
                
                # Try the original search term
                product_urls = self.lowes_scraper.scrape_search_term(
                    search_term=search_term,
                    max_pages=max_pages,
                    max_products=max_products
                )
                logger.info(f"Found {len(product_urls)} Lowe's product URLs from search term '{search_term}'")
                
                # If no results, try a simplified search term
                if not product_urls:
                    # Extract key words from the search term
                    simplified_term = ' '.join(search_term.split()[:3])  # Take first 3 words
                    if simplified_term != search_term:
                        logger.info(f"No results found. Trying simplified search term: '{simplified_term}'")
                        product_urls = self.lowes_scraper.scrape_search_term(
                            search_term=simplified_term,
                            max_pages=max_pages,
                            max_products=max_products
                        )
                        logger.info(f"Found {len(product_urls)} Lowe's product URLs from simplified search term '{simplified_term}'")
                
                # If still no results, try even simpler term
                if not product_urls and len(search_term.split()) > 1:
                    simpler_term = search_term.split()[0]  # Just the first word
                    logger.info(f"No results found. Trying first word only: '{simpler_term}'")
                    product_urls = self.lowes_scraper.
                    simpler_term = search_term.split()[0]  #
def scrape_lowes(self, urls=None, category_id=None, search_term=None, max_pages=5, max_products=0):
    """Scrape Lowe's products."""
    logger.info("Starting Lowe's scraper...")
    
    try:
        product_urls = []
        
        if urls:
            logger.info(f"Scraping {len(urls)} specific Lowe's URLs")
            product_urls = self.lowes_scraper.scrape_specific_urls(urls, max_products=max_products)
            logger.info(f"Found {len(product_urls)} Lowe's product URLs from specific URLs")
        elif category_id:
            logger.info(f"Scraping Lowe's category: {category_id}")
            product_urls = self.lowes_scraper.scrape_category(
                category_id=category_id,
                max_pages=max_pages,
                max_products=max_products
            )
            logger.info(f"Found {len(product_urls)} Lowe's product URLs from category {category_id}")
        elif search_term:
            logger.info(f"Scraping Lowe's search term: {search_term}")
            
            # Try different variations of the search term if the original doesn't work
            if not product_urls:
                # Try the original search term
                product_urls = self.lowes_scraper.scrape_search_term(
                    search_term=search_term,
                    max_pages=max_pages,
                    max_products=max_products
                )
                logger.info(f"Found {len(product_urls)} Lowe's product URLs from search term '{search_term}'")
            
            # If no results, try a simplified search term
            if not product_urls:
                # Extract key words from the search term
                simplified_term = ' '.join(search_term.split()[:3])  # Take first 3 words
                if simplified_term != search_term:
                    logger.info(f"No results found. Trying simplified search term: '{simplified_term}'")
                    product_urls = self.lowes_scraper.scrape_search_term(
                        search_term=simplified_term,
                        max_pages=max_pages,
                        max_products=max_products
                    )
                    logger.info(f"Found {len(product_urls)} Lowe's product URLs from simplified search term '{simplified_term}'")
            
            # If still no results, try Home Depot search as fallback
            if not product_urls and hasattr(self, 'hd_scraper'):
                logger.info(f"No Lowe's results found. Trying Home Depot search for: '{search_term}'")
                # Implement a Home Depot search method here
                # This would require implementing a search method for Home Depot
                
        else:
            logger.warning("No Lowe's scraping parameters provided (URLs, category, or search term)")
            return []
        
        if not product_urls:
            logger.warning("No Lowe's product URLs found to scrape")
            return []
        
        # Rest of the method remains the same...
            return []
    
    def save_results(self, format="json", prefix=None):
        """Save the scraped results."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        prefix = prefix or timestamp
        
        # Check if we have any results
        if not self.hd_products and not self.lowes_products:
            logger.error("No products were scraped. Nothing to save.")
            return None
        
        results = {
            "home_depot": self.hd_products,
            "lowes": self.lowes_products,
            "metadata": {
                "timestamp": timestamp,
                "home_depot_count": len(self.hd_products),
                "lowes_count": len(self.lowes_products),
                "total_count": len(self.hd_products) + len(self.lowes_products)
            }
        }
        
        try:
            if format.lower() == "json":
                output_file = os.path.join(self.output_dir, f"{prefix}_combined_results.json")
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(results, f, indent=2)
                logger.info(f"Results saved to {output_file}")
                return output_file
            
            elif format.lower() == "csv":
                output_files = {}
                
                # Save Home Depot results
                if self.hd_products:
                    hd_output_file = os.path.join(self.output_dir, f"{prefix}_homedepot_results.csv")
                    self._save_to_csv(self.hd_products, hd_output_file)
                    logger.info(f"Home Depot results saved to {hd_output_file}")
                    output_files["home_depot"] = hd_output_file
                
                # Save Lowe's results
                if self.lowes_products:
                    lowes_output_file = os.path.join(self.output_dir, f"{prefix}_lowes_results.csv")
                    # Use the Lowe's scraper's save method
                    self.lowes_scraper.save_results(format="csv", output_file=lowes_output_file)
                    logger.info(f"Lowe's results saved to {lowes_output_file}")
                    output_files["lowes"] = lowes_output_file
                
                return output_files
            
            else:
                logger.error(f"Unsupported format: {format}")
                return None
                
        except Exception as e:
            logger.error(f"Error saving results: {str(e)}")
            logger.error(traceback.format_exc())
            
    def _save_to_csv(self, products, output_file):
        """Save products to a CSV file."""
        if not products:
            logger.warning("No products to save")
            return
        
        # Get all possible headers from all products
        headers = set()
        for product in products:
            headers.update(product.keys())
        
        headers = sorted(list(headers))
        
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            for product in products:
                writer.writerow(product)

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Combined Home Depot and Lowe's Scraper")
    
    parser.add_argument("--hd-urls", nargs="+", help="List of Home Depot URLs to scrape")
    parser.add_argument("--lowes-urls", nargs="+", help="List of Lowe's URLs to scrape")
    parser.add_argument("--lowes-category", help="Lowe's category ID to scrape")
    parser.add_argument("--lowes-search", help="Lowe's search term to scrape")
    parser.add_argument("--max-pages", type=int, default=5, help="Maximum number of pages to scrape for category/search")
    parser.add_argument("--max-products", type=int, default=0, help="Maximum number of products to scrape (0 for all)")
    parser.add_argument("--output-dir", default="data", help="Output directory for scraped data")
    parser.add_argument("--format", choices=["json", "csv"], default="json", help="Output format")
    parser.add_argument("--prefix", help="Prefix for output files")
    parser.add_argument("--max-retries", type=int, default=3, help="Maximum number of retries for failed requests")
    parser.add_argument("--min-delay", type=float, default=1.0, help="Minimum delay between requests")
    parser.add_argument("--max-delay", type=float, default=3.0, help="Maximum delay between requests")
    
    return parser.parse_args()

def main():
    """Main function."""
    args = parse_args()
    
    # Check if we have something to scrape
    if not (args.hd_urls or args.lowes_urls or args.lowes_category or args.lowes_search):
        logger.error("No scraping targets specified. Please provide at least one of: --hd-urls, --lowes-urls, --lowes-category, --lowes-search")
        return 1
    
    # Initialize the combined scraper
    scraper = CombinedScraper(
        output_dir=args.output_dir,
        max_retries=args.max_retries,
        min_delay=args.min_delay,
        max_delay=args.max_delay
    )
    
    # Scrape Home Depot if URLs are provided
    if args.hd_urls:
        scraper.scrape_home_depot(urls=args.hd_urls, max_products=args.max_products)
    
    # Scrape Lowe's if URLs, category, or search term is provided
    if args.lowes_urls:
        scraper.scrape_lowes(urls=args.lowes_urls, max_pages=args.max_pages, max_products=args.max_products)
    elif args.lowes_category:
        scraper.scrape_lowes(category_id=args.lowes_category, max_pages=args.max_pages, max_products=args.max_products)
    elif args.lowes_search:
        scraper.scrape_lowes(search_term=args.lowes_search, max_pages=args.max_pages, max_products=args.max_products)
    
    # Save results
    scraper.save_results(format=args.format, prefix=args.prefix)

if __name__ == "__main__":
    main()
