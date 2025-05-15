#!/bin/bash

# Run the Home Depot scraper for specific products
python scrape_specific_products.py \
  --api-key 52323740B6D14CBE81D81C81E0DD32E6 \
  --urls-file product_urls.txt \
  --output-dir data \
  --format csv \
  --delay 1.5
