#!/bin/bash

# Run the Home Depot scraper for specific URLs
python -m homedepot_scraper.cli \
  --mode url \
  --urls-file "$1" \
  --output-dir data \
  --format csv \
  --template \
  --delay 1.5

echo "Scraping completed. Results saved to data/results directory."
