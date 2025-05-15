#!/usr/bin/env python3
"""
Script to fix missing prices in the Home Depot product CSV data.
"""

import csv
import os
import json
import glob

def find_price_in_raw_data(item_id):
    """Search for price in raw data files."""
    # Look in all raw JSON files
    raw_files = glob.glob("data/raw/product_*.json")
    
    for file_path in raw_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Check if this is the right product
                product = data.get('product', {})
                if product.get('item_id') == item_id:
                    # Try to get price from different locations
                    price = product.get('price')
                    if price:
                        return price
                    
                    # Try buybox winner
                    buybox = product.get('buybox_winner', {})
                    if buybox and 'price' in buybox:
                        return buybox.get('price')
        except (json.JSONDecodeError, FileNotFoundError):
            continue
    
    return None

def fix_missing_prices(file_path):
    """Fix missing prices in the CSV file."""
    with open(file_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)
    
    # Track products with missing prices
    missing_prices = []
    fixed_count = 0
    
    # Fix missing prices
    for row in rows:
        if not row[6]:  # Price column is empty
            item_id = row[2]  # Item ID column
            price = find_price_in_raw_data(item_id)
            
            if price:
                row[6] = str(price)
                fixed_count += 1
            else:
                missing_prices.append(row[0])  # Product name
    
    # Write the updated data back to the file
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    
    # Copy to desktop
    desktop_path = os.path.expanduser("~/Desktop/homedepot_products_final.csv")
    with open(file_path, 'r', newline='', encoding='utf-8') as infile:
        with open(desktop_path, 'w', newline='', encoding='utf-8') as outfile:
            outfile.write(infile.read())
    
    return fixed_count, missing_prices

def main():
    input_file = "data/results/homedepot_products_clean.csv"
    
    # Fix missing prices
    fixed_count, missing_prices = fix_missing_prices(input_file)
    
    print(f"Fixed {fixed_count} products with missing prices")
    
    if missing_prices:
        print(f"\n{len(missing_prices)} products still missing prices:")
        for product in missing_prices:
            print(f"  - {product}")
    else:
        print("\nAll products now have prices!")
    
    print(f"\nFinal data saved to ~/Desktop/homedepot_products_final.csv")

if __name__ == "__main__":
    main()
