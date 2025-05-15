#!/usr/bin/env python3
"""
Offline BigBox API Demo
This script demonstrates how to parse and use the sample product data
without requiring an active API key.
"""

import json
import sys

def load_sample_data(filename="sample_product_response.json"):
    """Load the sample product data from a JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Sample file '{filename}' not found.")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Unable to parse JSON in '{filename}'.")
        sys.exit(1)

def display_product_info(product_data):
    """Display key information from the product data."""
    if 'product' in product_data:
        product = product_data['product']
        
        print("\n=== Product Information ===")
        print(f"Title: {product.get('title', 'N/A')}")
        print(f"Brand: {product.get('brand', 'N/A')}")
        print(f"Item ID: {product.get('item_id', 'N/A')}")
        print(f"Model: {product.get('model_number', 'N/A')}")
        
        # Display price information
        if 'buybox_winner' in product:
            price_info = product['buybox_winner']
            price = price_info.get('price', 'N/A')
            currency = price_info.get('currency_symbol', '$')
            print(f"Price: {currency}{price}")
        
        # Display rating information
        print(f"Rating: {product.get('rating', 'N/A')} ({product.get('ratings_total', 0)} reviews)")
        
        # Display product features
        if 'feature_bullets' in product and product['feature_bullets']:
            print("\n=== Features ===")
            for feature in product['feature_bullets']:
                print(f"• {feature}")
        
        # Display specifications
        if 'specifications' in product and product['specifications']:
            print("\n=== Specifications ===")
            for spec in product['specifications'][:10]:  # Just show first 10
                print(f"• {spec.get('name', '')}: {spec.get('value', 'N/A')}")
        
        # Display fulfillment options
        if 'buybox_winner' in product and 'fulfillment' in product['buybox_winner']:
            fulfillment = product['buybox_winner']['fulfillment']
            print("\n=== Availability ===")
            
            if fulfillment.get('pickup') and 'pickup_info' in fulfillment:
                pickup = fulfillment['pickup_info']
                status = "In Stock" if pickup.get('in_stock') else "Out of Stock"
                stock = pickup.get('stock_level', 0)
                print(f"• Store Pickup: {status} ({stock} available)")
            
            if fulfillment.get('ship_to_home') and 'ship_to_home_info' in fulfillment:
                shipping = fulfillment['ship_to_home_info']
                status = "Available" if shipping.get('in_stock') else "Unavailable"
                print(f"• Ship to Home: {status}")
    else:
        print("No product data found in the response.")

def main():
    # Load the sample product data
    print("Loading sample product data...")
    result = load_sample_data()
    
    # Display API usage info (from the sample data)
    if 'request_info' in result:
        info = result['request_info']
        print("\n=== API Information ===")
        print(f"Success: {info.get('success', False)}")
        print(f"Credits used: {info.get('credits_used', 'Unknown')}")
        print(f"Credits remaining: {info.get('credits_remaining', 'Unknown')}")
    
    # Display the product information
    display_product_info(result)
    
    print("\nNote: This is using offline sample data. To fetch live data, you would need a valid API key.")

if __name__ == "__main__":
    main()
