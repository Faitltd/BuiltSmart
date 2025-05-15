#!/usr/bin/env python3
"""
Script to convert scraped Home Depot data to match the template format.
"""

import os
import csv
import json
from datetime import datetime

def convert_to_template(input_file, output_file, template_file):
    """Convert scraped data to match the template format."""
    # Read the template headers
    with open(template_file, 'r', newline='', encoding='utf-8') as f:
        template_reader = csv.reader(f)
        template_headers = next(template_reader)
    
    # Read the input data
    input_data = []
    with open(input_file, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            input_data.append(row)
    
    # Convert data to template format
    output_data = []
    for row in input_data:
        new_row = {header: '' for header in template_headers}
        
        # Map fields from input to template
        new_row['product_name'] = row.get('name', '')
        new_row['item_id'] = row.get('item_id', '')
        new_row['model_number'] = row.get('model_number', '')
        new_row['upc'] = row.get('upc', '')
        new_row['url'] = row.get('url', '')
        new_row['price'] = row.get('price', '')
        new_row['currency'] = row.get('currency', '$ USD')
        new_row['unit'] = 'each'
        
        # Combine description and features for details
        details = row.get('description', '')
        new_row['details'] = details
        
        # Combine all specifications
        specs = []
        for key, value in row.items():
            if key not in ['brand', 'currency', 'description', 'images', 'item_id', 
                          'model_number', 'name', 'price', 'rating', 'ratings_total', 
                          'upc', 'url', 'features'] and value:
                specs.append(f"{key}: {value}")
        
        # Add features if available
        if row.get('features'):
            try:
                if isinstance(row['features'], str):
                    if row['features']:
                        specs.append(f"Features: {row['features']}")
                elif isinstance(row['features'], list):
                    features_str = ', '.join(row['features'])
                    specs.append(f"Features: {features_str}")
            except:
                pass
                
        new_row['specifications'] = ' | '.join(specs)
        
        output_data.append(new_row)
    
    # Write the output data
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=template_headers)
        writer.writeheader()
        writer.writerows(output_data)
    
    print(f"Converted {len(output_data)} products to template format")
    return len(output_data)

if __name__ == "__main__":
    # Define input, output, and template files
    input_file = "hd_basic_items_data/results/homedepot_building_materials_2025-04-21.csv"
    output_file = "hd_basic_items_template.csv"
    template_file = "home_depot_products.csv"
    
    # Convert the data
    convert_to_template(input_file, output_file, template_file)
