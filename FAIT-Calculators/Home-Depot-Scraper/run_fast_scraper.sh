#!/bin/bash

# Run the enhanced Home Depot scraper for faster performance
python fast_scraper.py \
  --api-key 52323740B6D14CBE81D81C81E0DD32E6 \
  --urls-file "$1" \
  --output-dir data \
  --format csv \
  --min-delay 0.5 \
  --max-delay 2.0 \
  --batch-size 5 \
  --max-retries 3 \
  --backoff-factor 0.5 \
  --auto-save-interval 10

echo "Fast scraping completed. Results saved to data/results directory."
