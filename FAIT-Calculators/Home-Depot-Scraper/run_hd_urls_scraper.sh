#!/bin/bash

# Run the Home Depot scraper for the URLs in "HD URLs - Basic Items"
python scrape_specific_products.py \
  --api-key 52323740B6D14CBE81D81C81E0DD32E6 \
  --urls-file "HD URLs - Basic Items" \
  --output-dir hd_basic_items_data \
  --format csv \
  --delay 1.5
