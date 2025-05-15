# BigBox API Client

A Python client for the BigBox API that retrieves public-domain data from Home Depot in real-time.

## Features

- Simple interface for making API requests
- Support for different request types (products, search results, etc.)
- Response parsing and formatting
- Error handling
- Customizable requests with various parameters

## Installation

1. Ensure you have Python 3.6 or higher installed
2. Install required dependencies:

```bash
pip install requests
```

## Usage

```python
from bigbox_client import BigBoxClient

# Initialize client with your API key
client = BigBoxClient("YOUR_API_KEY")

# Get product information by URL
product = client.get_product_by_url("https://www.homedepot.com/p/example/123456789")

# Get product information by item ID
product = client.get_product_by_id("123456789")

# Search for products
search_results = client.search("lawn mower", sort_by="best_seller")

# Print the results
print(product)
print(search_results)
```

## Documentation

For more detailed information on available methods and parameters, see the docstrings in the code.

## License

MIT
