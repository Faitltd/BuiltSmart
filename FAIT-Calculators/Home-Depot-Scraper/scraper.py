import requests
from bs4 import BeautifulSoup
import json
import time
import random

class ProductScraper:
    def __init__(self):
        self.headers = {
            'authority': 'www.homedepot.com',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'none',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        self.session = requests.Session()
    
    def get_page(self, page=1):
        """Fetch a page of products"""
        url = f"https://www.homedepot.com/b/Lumber-Composites-Plywood/Special-Values/N-5yc1vZbqm7Z7?page={page}"
        
        try:
            print(f"Fetching page {page}...")
            response = self.session.get(url, headers=self.headers)
            response.raise_for_status()
            
            # Save raw HTML for debugging
            with open(f'page_{page}.html', 'w', encoding='utf-8') as f:
                f.write(response.text)
            print(f"Saved raw HTML to page_{page}.html")
            
            return response.text
        except requests.RequestException as e:
            print(f"Error fetching page {page}: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"Response Status: {e.response.status_code}")
            return None
    
    def extract_products(self, html):
        """Extract product information from HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        products = []
        
        # Find all product containers
        product_containers = soup.find_all('div', {'data-type': 'product'})
        print(f"Found {len(product_containers)} products on page")
        
        for container in product_containers:
            try:
                # Extract product information
                product = {}
                
                # Get name and link
                name_elem = container.find('span', {'class': 'product-title__title'})
                if name_elem:
                    product['name'] = name_elem.text.strip()
                    link_elem = name_elem.find_parent('a')
                    if link_elem:
                        product['link'] = 'https://www.homedepot.com' + link_elem.get('href', '')
                
                # Get SKU
                sku_elem = container.find('div', {'class': 'product-identifier'})
                if sku_elem:
                    product['sku'] = sku_elem.text.replace('SKU #', '').strip()
                
                # Get price
                price_elem = container.find('div', {'class': 'price-format__main-price'})
                if price_elem:
                    product['price'] = price_elem.text.strip()
                
                # Get image
                img_elem = container.find('img', {'class': 'product-image'})
                if img_elem:
                    product['image'] = img_elem.get('src', '')
                
                # Get description
                desc_elem = container.find('div', {'class': 'product-description'})
                if desc_elem:
                    product['description'] = desc_elem.text.strip()
                
                # Add default values for missing fields
                product.setdefault('name', 'N/A')
                product.setdefault('link', 'N/A')
                product.setdefault('sku', 'N/A')
                product.setdefault('price', 'N/A')
                product.setdefault('image', 'N/A')
                product.setdefault('description', 'N/A')
                
                products.append(product)
                print(f"Extracted product: {product['name']}")
                
            except Exception as e:
                print(f"Error extracting product: {str(e)}")
                continue
        
        return products
    
    def scrape_products(self):
        """Main method to scrape products"""
        print("Starting scraper...")
        all_products = []
        max_pages = 3  # Limit to 3 pages for testing
        
        try:
            for page in range(1, max_pages + 1):
                html = self.get_page(page)
                if not html:
                    print(f"Failed to fetch page {page}")
                    break
                
                products = self.extract_products(html)
                all_products.extend(products)
                
                print(f"Progress: {len(all_products)} total products scraped")
                
                if page < max_pages:
                    delay = random.uniform(2, 4)
                    print(f"Waiting {delay:.1f} seconds before next page...")
                    time.sleep(delay)
            
            print(f"\nTotal products scraped: {len(all_products)}")
            
            # Save results
            if all_products:
                with open('products.json', 'w', encoding='utf-8') as f:
                    json.dump(all_products, f, indent=2, ensure_ascii=False)
                print("Results saved to products.json")
            else:
                print("\nNo products were scraped.")
                print("Raw HTML pages have been saved for inspection.")
            
        except Exception as e:
            print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    scraper = ProductScraper()
    scraper.scrape_products()
