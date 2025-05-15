#!/usr/bin/env python3
"""
Script to clean up the Home Depot product CSV data:
1. Extract SKUs from specifications when available
2. Remove duplicate products
3. Ensure data is properly aligned with headers
4. Do not add any data not present in the original scrape
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
    input_file = "data/results/combined_products.csv"
    output_file = "data/results/homedepot_products_final.csv"
    
    # Read the CSV file
    with open(input_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        headers = next(reader)
        rows = list(reader)
    
    # Track unique products by URL to remove duplicates
    unique_products = {}
    
    # Process each row
    for row in rows:
        url = row[5]  # URL is in the 6th column (index 5)
        
        # Extract SKU if it's missing but present in specifications
        if not row[1] and "sku:" in row[10]:
            row[1] = extract_sku_from_specs(row[10])
        
        # Only keep the most complete version of each product (by URL)
        if url not in unique_products or (not unique_products[url][1] and row[1]):
            unique_products[url] = row
    
    # Get the unique rows
    unique_rows = list(unique_products.values())
    
    # Write the cleaned data to the output file
    with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        writer = csv.writer(outfile)
        writer.writerow(headers)
        writer.writerows(unique_rows)
    
    print(f"Processed {len(rows)} rows")
    print(f"Removed {len(rows) - len(unique_rows)} duplicate products")
    print(f"Saved {len(unique_rows)} unique products to {output_file}")
    
    # Copy to desktop for easy access
    desktop_path = os.path.expanduser("~/Desktop/homedepot_products_final.csv")
    with open(output_file, 'r', newline='', encoding='utf-8') as infile:
        with open(desktop_path, 'w', newline='', encoding='utf-8') as outfile:
            outfile.write(infile.read())
    print(f"Copied clean data to {desktop_path}")
    
    # Count products with SKUs
    with open(output_file, 'r', newline='', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        next(reader)  # Skip header
        rows = list(reader)
        
        products_with_sku = sum(1 for row in rows if row[1])
        print(f"Products with SKU: {products_with_sku} out of {len(rows)} ({products_with_sku/len(rows)*100:.1f}%)")

if __name__ == "__main__":
    main()
