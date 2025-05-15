#!/bin/bash
# Schedule Weekly Building Supplies Scraper
# This script runs the weekly building supplies scraper and logs the results
# It should be set up as a cron job to run weekly

# Configuration
API_KEY="52323740B6D14CBE81D81C81E0DD32E6"
OUTPUT_DIR="$HOME/building_supplies_data"
LOG_DIR="$HOME/building_supplies_logs"
SCRIPT_PATH="$HOME/Desktop/homedepot_scraper/improved_weekly_scraper.py"
DATE=$(date +"%Y-%m-%d")

# Create directories if they don't exist
mkdir -p "$OUTPUT_DIR"
mkdir -p "$LOG_DIR"

# Log file for this run
LOG_FILE="$LOG_DIR/scraper_$DATE.log"

# Start logging
echo "===============================================" >> "$LOG_FILE"
echo "Starting weekly building supplies scraper at $(date)" >> "$LOG_FILE"
echo "===============================================" >> "$LOG_FILE"

# Run the scraper and log output
python3 "$SCRIPT_PATH" \
  --api-key "$API_KEY" \
  --output-dir "$OUTPUT_DIR" \
  >> "$LOG_FILE" 2>&1

# Check if the script ran successfully
if [ $? -eq 0 ]; then
  echo "Scraper completed successfully at $(date)" >> "$LOG_FILE"
  
  # Check if CSV was created
  CSV_FILE="$OUTPUT_DIR/building_supplies_$DATE.csv"
  if [ -f "$CSV_FILE" ]; then
    PRODUCT_COUNT=$(wc -l < "$CSV_FILE")
    PRODUCT_COUNT=$((PRODUCT_COUNT - 1))  # Subtract header row
    echo "Generated CSV file with $PRODUCT_COUNT products" >> "$LOG_FILE"
  else
    echo "WARNING: CSV file was not created" >> "$LOG_FILE"
  fi
else
  echo "ERROR: Scraper failed with exit code $?" >> "$LOG_FILE"
fi

echo "===============================================" >> "$LOG_FILE"

# Create a symlink to the latest log file for easy access
ln -sf "$LOG_FILE" "$LOG_DIR/latest.log"

# Optional: Send email notification on completion
# mail -s "Building Supplies Scraper Report $DATE" your@email.com < "$LOG_FILE"

exit 0
