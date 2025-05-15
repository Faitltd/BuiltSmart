#!/usr/bin/env python3
"""
Improved script to clean up the Home Depot product CSV data:
1. Extract SKUs from specifications column
2. Remove duplicate products
3. Clean up specifications format
4. Ensure data is properly aligned with headers
5. Fix duplicate features in specifications
"""

import csv
import re
import os
import json

def extract_sku(specs):
    """Extract SKU from specifications string."""
    sku_match = re.search(r'sku: (\d+)', specs)
    if sku_match:
        return sku_match.group(1)
    return ""

def clean_specifications(specs):
    """Clean up the specifications format."""
    # Extract features
    features_match = re.search(r'Features: (.*?)(?:\s*\||$)', specs)
    features = features_match.group(1).strip() if features_match else ""
    
    # Try to extract specifications from the JSON-like format
    specs_list = []
    specs_match = re.search(r'specifications: (\[.*?\])', specs)
    if specs_match:
        try:
            # Convert single quotes to double quotes for JSON parsing
            json_str = specs_match.group(1).replace("'", '"')
            specs_data = json.loads(json_str)
            for spec in specs_data:
                if 'name' in spec and 'value' in spec:
                    specs_list.append(f"{spec['name']}: {spec['value']}")
        except json.JSONDecodeError:
            # If JSON parsing fails, extract key specs manually
            for key in ['Material', 'Color', 'Dimensions', 'Size']:
                key_match = re.search(fr"'{key}': '(.*?)'", specs)
                if key_match:
                    specs_list.append(f"{key}: {key_match.group(1)}")
    
    # Add features if not already in specs_list
    if features and not any('Features:' in spec for spec in specs_list):
        specs_list.append(f"Features: {features}")
    
    # Join all specifications with pipe separator
    return " | ".join(specs_list)

def main():
    input_file = "data/results/combined_products.csv"
    output_file = "data/results/homedepot_products_clean.csv"
    
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
        
        # Extract SKU if it's missing
        if not row[1] and "sku:" in row[10]:
            row[1] = extract_sku(row[10])
        
        # Clean up specifications
        if row[10]:
            row[10] = clean_specifications(row[10])
        
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
    desktop_path = os.path.expanduser("~/Desktop/homedepot_products_clean.csv")
    with open(output_file, 'r', newline='', encoding='utf-8') as infile:
        with open(desktop_path, 'w', newline='', encoding='utf-8') as outfile:
            outfile.write(infile.read())
    print(f"Copied clean data to {desktop_path}")

if __name__ == "__main__":
    main()
