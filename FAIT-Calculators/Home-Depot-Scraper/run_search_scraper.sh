#!/bin/bash

# Run the Home Depot scraper with search terms
python -m homedepot_scraper.cli \
  --api-key 52323740B6D14CBE81D81C81E0DD32E6 \
  --mode search \
  --search-terms-file search_terms.txt \
  --max-pages 2 \
  --output-dir data \
  --format csv \
  --delay 1.5
