# Using the BigBox API Client

This guide provides instructions on how to use the BigBox API client library to retrieve data from Home Depot through the BigBox API.

## Installation

To install the package, run:

```bash
# Install from the current directory
pip install .
```

## Quick Start

### Using the Demo Script

The simplest way to get started is to run the demo script:

```bash
python demo.py
```

This will retrieve information about the OSB Sheathing Panel using the provided API key and URL, and save the complete response to `product_data.json`.

### Using the Command Line Interface

The package includes a powerful command-line interface:

```bash
# Get help
python -m bigbox_api_client.cli --help

# Get product information by URL
python -m bigbox_api_client.cli product --url "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"

# Search for products
python -m bigbox_api_client.cli search "lawn mower" --sort-by best_seller

# Check remaining API credits
python -m bigbox_api_client.cli credits
```

### Using the Example Scripts

Example scripts demonstrate more complex usage:

```bash
# Get detailed product information
python -m bigbox_api_client.examples.product_details

# Search for products with more options
python -m bigbox_api_client.examples.search_products "power tools" --sort best_seller --zipcode 10001
```

## Using the Library in Your Code

### Basic Product Lookup

```python
from bigbox_api_client import BigBoxClient

# Initialize with your API key
client = BigBoxClient("52323740B6D14CBE81D81C81E0DD32E6")

# Get product by URL
product_data = client.get_product_by_url(
    "https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230"
)

# Extract useful information
from bigbox_api_client.utils import extract_product_details
product = extract_product_details(product_data)

print(f"Title: {product['title']}")
print(f"Price: ${product['price'].get('current_price', 0)}")
```

### Searching for Products

```python
# Search for products
search_results = client.search("lawn mower", sort_by="best_seller")

# Extract products from search results
from bigbox_api_client.utils import extract_search_products
products = extract_search_products(search_results)

# Display top 3 products
for i, product in enumerate(products[:3], 1):
    print(f"{i}. {product['title']} - ${product['price'].get('current_price', 0)}")
```

## Available Methods

### BigBoxClient

- `get_product_by_url(url)`: Get product information by URL
- `get_product_by_id(item_id)`: Get product information by item ID
- `search(search_term, sort_by, customer_zipcode, page)`: Search for products
- `get_category(category_id, sort_by, customer_zipcode, page)`: Get products in a category
- `get_reviews(item_id, sort_by, page)`: Get product reviews
- `get_questions(item_id, page)`: Get product questions and answers
- `get_remaining_credits()`: Get remaining API credits

### Utility Functions

- `extract_product_details(response)`: Extract simplified product details
- `extract_search_products(response)`: Extract products from search results
- `get_pagination_info(response)`: Extract pagination information
- `get_price_info(response)`: Extract price information
- `get_availability_info(response)`: Extract availability information

## Environment Variables

You can set the `BIGBOX_API_KEY` environment variable to avoid passing the API key with every command:

```bash
export BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6
