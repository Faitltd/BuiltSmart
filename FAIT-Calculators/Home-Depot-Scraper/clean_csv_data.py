#!/usr/bin/env python3
"""
Script to clean up the Home Depot product CSV data:
1. Extract SKUs from specifications column
2. Remove duplicate products
3. Clean up specifications format
4. Ensure data is properly aligned with headers
"""

import csv
import re
import os

def extract_sku(specs):
    """Extract SKU from specifications string."""
    sku_match = re.search(r'sku: (\d+)', specs)
    if sku_match:
        return sku_match.group(1)
    return ""

def clean_specifications(specs):
    """Clean up the specifications format."""
    # Remove the Python dictionary-like format
    cleaned = re.sub(r'specifications: \[\{.*?\}\]', '', specs)
    
    # Extract key information in a more readable format
    features_match = re.search(r'Features: (.*?)(?:\||$)', specs)
    features = features_match.group(1).strip() if features_match else ""
    
    # Extract other important specifications
    material_match = re.search(r"'Material': '(.*?)'", specs)
    material = material_match.group(1) if material_match else ""
    
    dimensions = []
    for dim in ['Length', 'Width', 'Thickness', 'Height']:
        dim_match = re.search(fr"'Actual Product {dim} \(.*?\)': '(.*?)'", specs)
        if dim_match:
            dimensions.append(f"{dim}: {dim_match.group(1)}")
    
    # Combine the cleaned information
    result = []
    if material:
        result.append(f"Material: {material}")
    if dimensions:
        result.append(" | ".join(dimensions))
    if features:
        result.append(f"Features: {features}")
    
    # Add any remaining pipe-separated values
    remaining = re.sub(r'.*\| ', '', cleaned).strip()
    if remaining and not remaining.startswith('sku:'):
        result.append(remaining)
    
    return " | ".join(result)

def main():
    input_file = "data/results/combined_products.csv"
    output_file = "data/results/homedepot_products_clean.csv"
    
    # Create a backup of the original file
    backup_file = "data/results/combined_products_backup.csv"
    if os.path.exists(input_file) and not os.path.exists(backup_file):
        with open(input_file, 'r', newline='', encoding='utf-8') as infile:
            with open(backup_file, 'w', newline='', encoding='utf-8') as outfile:
                outfile.write(infile.read())
        print(f"Created backup at {backup_file}")
    
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
