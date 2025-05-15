#!/usr/bin/env python3
"""
Script to combine multiple CSV files into a single file.
"""

import os
import csv
import sys

def combine_csv_files(input_files, output_file):
    """Combine multiple CSV files into a single file."""
    if not input_files:
        print("No input files provided.")
        return
    
    # Read the header from the first file
    with open(input_files[0], 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
    
    # Write the combined data to the output file
    with open(output_file, 'w', newline='', encoding='utf-8') as f_out:
        writer = csv.writer(f_out)
        writer.writerow(header)
        
        # Process each input file
        for input_file in input_files:
            print(f"Processing {input_file}...")
            with open(input_file, 'r', newline='', encoding='utf-8') as f_in:
                reader = csv.reader(f_in)
                next(reader)  # Skip header
                for row in reader:
                    writer.writerow(row)
    
    print(f"Combined data saved to {output_file}")

if __name__ == "__main__":
    # Get all batch CSV files
    input_files = [
        "data/results/batch1_products.csv",
        "data/results/batch2_products.csv",
        "data/results/batch3_products.csv",
        "data/results/batch4_products.csv",
        "data/results/batch5_products.csv",
        "data/results/batch6_products.csv",
        "data/results/batch7_products.csv"
    ]
    
    # Filter out files that don't exist
    input_files = [f for f in input_files if os.path.exists(f)]
    
    output_file = "data/results/combined_products.csv"
    combine_csv_files(input_files, output_file)
