#!/usr/bin/env python3
"""
Script to validate the cleaned Home Depot product CSV data:
1. Check for missing values in important columns
2. Verify data types (numeric for prices, etc.)
3. Generate a validation report
"""

import csv
import os

def validate_csv(file_path):
    """Validate the CSV data and generate a report."""
    with open(file_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        headers = next(reader)
        rows = list(reader)
    
    # Initialize validation counters
    total_rows = len(rows)
    missing_values = {header: 0 for header in headers}
    invalid_prices = 0
    
    # Validate each row
    for row in rows:
        # Check for missing values
        for i, value in enumerate(row):
            if not value.strip():
                missing_values[headers[i]] += 1
        
        # Validate price (should be numeric)
        try:
            if row[6]:  # Price column
                float(row[6])
        except ValueError:
            invalid_prices += 1
    
    # Generate validation report
    report = [
        "CSV Validation Report",
        "===================",
        f"Total products: {total_rows}",
        "",
        "Missing Values:",
    ]
    
    for header, count in missing_values.items():
        if count > 0:
            report.append(f"  {header}: {count} ({count/total_rows*100:.1f}%)")
    
    if invalid_prices > 0:
        report.append(f"\nInvalid prices: {invalid_prices} ({invalid_prices/total_rows*100:.1f}%)")
    
    report.append("\nValidation complete!")
    
    return "\n".join(report)

def main():
    input_file = "data/results/homedepot_products_clean.csv"
    
    # Validate the CSV data
    validation_report = validate_csv(input_file)
    print(validation_report)
    
    # Save the validation report
    report_file = "data/results/validation_report.txt"
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(validation_report)
    
    print(f"\nValidation report saved to {report_file}")

if __name__ == "__main__":
    main()
