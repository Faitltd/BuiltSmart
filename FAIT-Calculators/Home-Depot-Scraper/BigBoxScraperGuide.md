# Home Depot Building Supplies Scraper Guide

This guide explains how to use the tools for scraping Home Depot Building Supplies data via the BigBox API.

## Overview

The following tools are available:

1. **Simple Web UI Scraper** (fixed_scraper.py)
2. **CLI Scraper** (building_supplies_cli_scraper.py)

Both tools use the BigBox API to fetch building supplies product data from Home Depot.

## API Key

The default API key is: `52323740B6D14CBE81D81C81E0DD32E6`

This key is set as the default in both tools, but you can change it if needed.

## Web UI Scraper (fixed_scraper.py)

The web UI provides a user-friendly interface for controlling the scraper.

### Features:

- Interactive web interface accessible via browser
- Real-time progress updates and logging
- File browser for viewing and downloading scraped data
- Ability to set maximum pages and products to scrape
- Automatically handles busy ports

### Usage:

1. Run the script:
   ```
   python3 fixed_scraper.py
   ```

2. A browser window will open automatically at http://localhost:8888 (or another port if 8888 is busy)

3. Configure your scraping parameters:
   - API Key: Your BigBox API key
   - Output Directory: Where to save the scraped data
   - Maximum Pages (optional): Limit the number of pages to scrape
   - Maximum Products (optional): Limit the number of products to scrape

4. Click "Start Scraping" to begin

5. Monitor progress in real-time

6. Click "View Results" to browse and download scraped files

## CLI Scraper (building_supplies_cli_scraper.py)

The command-line interface is ideal for scripting or batch jobs.

### Usage:

```
python3 building_supplies_cli_scraper.py [options]
```

### Options:

- `--api-key KEY`: Your BigBox API key
- `--output-dir DIR`: Directory to save scraped data
- `--max-pages N`: Maximum number of pages to scrape
- `--max-products N`: Maximum number of products to scrape

Example:
```
python3 building_supplies_cli_scraper.py --max-pages 5 --max-products 50
```

## Output Files

Both scrapers generate the following files:

- `page_X.json`: Data for each page of search results
- `product_ITEMID.json`: Detailed data for each individual product
- `all_products.json`: Combined file with all scraped products

## Tips

1. **Rate Limiting**: The scraper includes built-in delays to avoid overwhelming the API. If you're hitting rate limits, try increasing the delay or limiting the number of products.

2. **File Size**: The `all_products.json` file can get quite large if you scrape many products. If you encounter memory issues, consider using the individual product files instead.

3. **Error Handling**: The scraper will log errors but continue running. Check the logs for any issues.

4. **Categories**: The current implementation focuses on the Building Supplies category (ID: N-5yc1vZaqns). You can modify the code to target other categories.

## Troubleshooting

1. **Port already in use**: The web UI will automatically try alternative ports (8000, 8080, 8888, 9000)

2. **API errors**: Check your API key and ensure you haven't exceeded your quota

3. **Connection issues**: Ensure you have a stable internet connection

4. **File access errors**: Make sure the output directory is writable

## Implementation Details

The scrapers are implemented in Python and use the following libraries:

- `http.server` and `socketserver` for the web interface
- `threading` for asynchronous scraping
- `urllib` for making HTTP requests
- `json` for parsing and saving data

The web UI uses plain HTML, CSS, and JavaScript without external dependencies.
