#!/usr/bin/env python3
"""
Command-line interface for the BigBox API client.
"""

import argparse
import json
import sys
import os
from typing import Dict, Any, Optional

# Import the BigBox client and utilities
from .client import BigBoxClient
from .utils import (
    extract_product_details,
    extract_search_products,
    get_pagination_info
)


def format_json(data: Dict[str, Any]) -> str:
    """Format JSON data for pretty printing."""
    return json.dumps(data, indent=2)


def product_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the product command."""
    if args.item_id:
        response = client.get_product_by_id(args.item_id)
    elif args.url:
        response = client.get_product_by_url(args.url)
    else:
        print("Error: Either --item-id or --url must be provided")
        sys.exit(1)
    
    # Print credits information
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    if args.raw:
        print(format_json(response))
    else:
        # Extract and print simplified product details
        product = extract_product_details(response)
        print(format_json(product))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            if args.raw:
                json.dump(response, f, indent=2)
            else:
                json.dump(product, f, indent=2)
        print(f"Output saved to {args.output}")


def search_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the search command."""
    response = client.search(
        search_term=args.term,
        sort_by=args.sort_by,
        customer_zipcode=args.zipcode,
        page=args.page
    )
    
    # Print credits information
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    # Print pagination information
    pagination = get_pagination_info(response)
    if pagination:
        print(f"Showing page {pagination['current_page']} of {pagination['total_pages']}")
        print(f"Total results: {pagination['total_results']}")
    
    if args.raw:
        print(format_json(response))
    else:
        # Extract and print products
        products = extract_search_products(response)
        print(format_json(products))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            if args.raw:
                json.dump(response, f, indent=2)
            else:
                json.dump(products, f, indent=2)
        print(f"Output saved to {args.output}")


def reviews_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the reviews command."""
    response = client.get_reviews(
        item_id=args.item_id,
        sort_by=args.sort_by,
        page=args.page
    )
    
    # Print credits information
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    # Print the raw or processed response
    print(format_json(response))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(response, f, indent=2)
        print(f"Output saved to {args.output}")


def questions_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the questions command."""
    response = client.get_questions(
        item_id=args.item_id,
        page=args.page
    )
    
    # Print credits information
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    # Print the raw or processed response
    print(format_json(response))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(response, f, indent=2)
        print(f"Output saved to {args.output}")


def category_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the category command."""
    response = client.get_category(
        category_id=args.category_id,
        sort_by=args.sort_by,
        customer_zipcode=args.zipcode,
        page=args.page
    )
    
    # Print credits information
    print(f"Credits used: {response['request_info']['credits_used']}")
    print(f"Credits remaining: {response['request_info']['credits_remaining']}")
    
    # Print the raw or processed response
    print(format_json(response))
    
    # Save to file if requested
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(response, f, indent=2)
        print(f"Output saved to {args.output}")


def credits_command(args: argparse.Namespace, client: BigBoxClient) -> None:
    """Handle the credits command."""
    credits = client.get_remaining_credits()
    print(f"Remaining API credits: {credits}")


def main():
    """Main entry point for the CLI."""
    # Create the main parser
    parser = argparse.ArgumentParser(description='BigBox API Client CLI')
    parser.add_argument('--api-key', help='Your BigBox API key', 
                        default=os.environ.get('BIGBOX_API_KEY', '52323740B6D14CBE81D81C81E0DD32E6'))
    
    # Create subparsers for the different commands
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Product command
    product_parser = subparsers.add_parser('product', help='Get product details')
    product_parser.add_argument('--item-id', help='Product item ID')
    product_parser.add_argument('--url', help='Product URL')
    product_parser.add_argument('--raw', action='store_true', help='Output raw API response')
    product_parser.add_argument('--output', '-o', help='Save output to file')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Search for products')
    search_parser.add_argument('term', help='Search term')
    search_parser.add_argument('--sort-by', choices=['best_seller', 'price_low_to_high', 
                                                    'price_high_to_low', 'top_rated'], 
                              default='best_seller', help='Sort order')
    search_parser.add_argument('--zipcode', help='Customer zipcode for localized results')
    search_parser.add_argument('--page', type=int, default=1, help='Page number')
    search_parser.add_argument('--raw', action='store_true', help='Output raw API response')
    search_parser.add_argument('--output', '-o', help='Save output to file')
    
    # Reviews command
    reviews_parser = subparsers.add_parser('reviews', help='Get product reviews')
    reviews_parser.add_argument('item_id', help='Product item ID')
    reviews_parser.add_argument('--sort-by', choices=['most_recent', 'most_helpful', 
                                                     'highest_rated', 'lowest_rated'], 
                               default='most_recent', help='Sort order')
    reviews_parser.add_argument('--page', type=int, default=1, help='Page number')
    reviews_parser.add_argument('--output', '-o', help='Save output to file')
    
    # Questions command
    questions_parser = subparsers.add_parser('questions', help='Get product questions')
    questions_parser.add_argument('item_id', help='Product item ID')
    questions_parser.add_argument('--page', type=int, default=1, help='Page number')
    questions_parser.add_argument('--output', '-o', help='Save output to file')
    
    # Category command
    category_parser = subparsers.add_parser('category', help='Get products in a category')
    category_parser.add_argument('category_id', help='Category ID')
    category_parser.add_argument('--sort-by', choices=['best_seller', 'price_low_to_high', 
                                                      'price_high_to_low', 'top_rated'], 
                                default='best_seller', help='Sort order')
    category_parser.add_argument('--zipcode', help='Customer zipcode for localized results')
    category_parser.add_argument('--page', type=int, default=1, help='Page number')
    category_parser.add_argument('--output', '-o', help='Save output to file')
    
    # Credits command
    subparsers.add_parser('credits', help='Get remaining API credits')
    
    # Parse arguments
    args = parser.parse_args()
    
    # If no command is given, print help and exit
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Create the client
    client = BigBoxClient(args.api_key)
    
    # Call the appropriate function based on the command
    if args.command == 'product':
        product_command(args, client)
    elif args.command == 'search':
        search_command(args, client)
    elif args.command == 'reviews':
        reviews_command(args, client)
    elif args.command == 'questions':
        questions_command(args, client)
    elif args.command == 'category':
        category_command(args, client)
    elif args.command == 'credits':
        credits_command(args, client)


if __name__ == '__main__':
    main()
