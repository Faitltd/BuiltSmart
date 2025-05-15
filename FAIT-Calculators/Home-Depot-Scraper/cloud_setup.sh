#!/bin/bash
# Cloud Setup Script for Home Depot Scraper
# This script sets up the Home Depot scraper in a cloud environment

# Exit on error
set -e

# Configuration
API_KEY="${BIGBOX_API_KEY:-52323740B6D14CBE81D81C81E0DD32E6}"
OUTPUT_DIR="${OUTPUT_DIR:-/app/data}"
LOG_DIR="${LOG_DIR:-/app/logs}"

# Create directories
mkdir -p "$OUTPUT_DIR/raw"
mkdir -p "$OUTPUT_DIR/results"
mkdir -p "$LOG_DIR"

# Install dependencies
pip install -r requirements.txt

# Set up cron job for weekly execution
# Run every Sunday at 2:00 AM
echo "0 2 * * 0 python -m homedepot_scraper.cloud > $LOG_DIR/cron_$(date +\%Y-\%m-\%d).log 2>&1" > /tmp/crontab
crontab /tmp/crontab
rm /tmp/crontab

echo "Home Depot Scraper setup completed"
echo "Scraper will run weekly on Sundays at 2:00 AM"
echo "Results will be saved to $OUTPUT_DIR/results"
echo "Logs will be saved to $LOG_DIR"

# Run the scraper immediately if requested
if [ "$RUN_NOW" = "true" ]; then
  echo "Running scraper now..."
  python -m homedepot_scraper.cloud --run-now
fi
