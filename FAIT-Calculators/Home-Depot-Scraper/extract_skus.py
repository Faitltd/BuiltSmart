#!/usr/bin/env python3
"""
Script to extract SKUs from specifications column and ensure data is properly formatted.
"""

import csv
import re
import os

def extract_sku_from_specs(specs):
    """Extract SKU from specifications string if present."""
    sku_match = re.search(r'sku: (\d+)', specs)
    if sku_match:
        return sku_match.group(1)
    return ""

def main():
    input_file = "data/results/new_products.csv"
    output_file = "data/results/new_products_with_skus.csv"
    
    # Read the CSV file
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)
        rows = list(reader)
    
    # Track products with missing SKUs
    missing_skus_before = 0
    missing_skus_after = 0
    
    # Process each row
    for row in rows:
        # Check if SKU is missing
        if not row[1]:
            missing_skus_before += 1
            
            # Extract SKU from specifications if present
            if "sku:" in row[10]:
                row[1] = extract_sku_from_specs(row[10])
            
            # Check if SKU is still missing
            if not row[1]:
                missing_skus_after += 1
    
    # Write the updated data to the output file
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(headers)
        writer.writerows(rows)
    
    print(f"Processed {len(rows)} products")
    print(f"Products with missing SKUs before: {missing_skus_before}")
    print(f"Products with missing SKUs after: {missing_skus_after}")
    
    # Copy to desktop for easy access
    desktop_path = os.path.expanduser("~/Desktop/homedepot_products_new.csv")
    with open(output_file, 'r', newline='', encoding='utf-8') as infile:
        with open(desktop_path, 'w', newline='', encoding='utf-8') as outfile:
            outfile.write(infile.read())
    print(f"Copied clean data to {desktop_path}")

if __name__ == "__main__":
    main()
