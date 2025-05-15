#!/bin/bash

# This script runs the Home Depot scraper for all products in smaller batches
# to avoid potential issues with large numbers of products

# Split the product_urls.txt file into smaller batches of 10 products each
mkdir -p batches
split -l 10 product_urls.txt batches/batch_

# Run the scraper for each batch
for batch_file in batches/batch_*; do
  echo "Processing batch: $batch_file"
  python scrape_specific_products.py \
    --api-key 52323740B6D14CBE81D81C81E0DD32E6 \
    --urls-file "$batch_file" \
    --output-dir data \
    --format csv \
    --delay 1.5
  
  # Add a short delay between batches
  sleep 5
done

echo "All batches processed successfully!"
