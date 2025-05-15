from typing import Dict, List, Optional, Any, Union


def extract_product_details(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract key product details from an API response in a simplified format.
    
    Args:
        response (Dict[str, Any]): The raw API response
        
    Returns:
        Dict[str, Any]: Simplified product details
    """
    if not response or 'product' not in response:
        return {}
    
    product = response['product']
    
    details = {
        'title': product.get('title', ''),
        'brand': product.get('brand', ''),
        'model_number': product.get('model_number', ''),
        'item_id': product.get('item_id', ''),
        'description': product.get('description', ''),
        'rating': product.get('rating', 0),
        'ratings_total': product.get('ratings_total', 0),
        'price': get_price_info(response),
        'image_url': get_primary_image(product),
        'specifications': group_specifications(product.get('specifications', [])),
        'features': product.get('feature_bullets', []),
        'availability': get_availability_info(response)
    }
    
    return details


def get_price_info(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract price information from an API response.
    
    Args:
        response (Dict[str, Any]): The raw API response
        
    Returns:
        Dict[str, Any]: Formatted price information
    """
    if not response or 'product' not in response or 'buybox_winner' not in response['product']:
        return {}
    
    buybox = response['product']['buybox_winner']
    
    price_info = {
        'current_price': buybox.get('price', 0),
        'currency': buybox.get('currency', 'USD'),
        'currency_symbol': buybox.get('currency_symbol', '$'),
        'unit': buybox.get('unit', 'each')
    }
    
    # Check for regular/original price if it exists (sale detection)
    if 'regular_price' in buybox:
        price_info['regular_price'] = buybox['regular_price']
        price_info['is_on_sale'] = buybox['price'] < buybox['regular_price']
        
        if price_info.get('is_on_sale', False):
            price_info['savings'] = buybox['regular_price'] - buybox['price']
            if buybox['regular_price'] > 0:
                price_info['savings_percent'] = round((price_info['savings'] / buybox['regular_price']) * 100, 1)
    
    return price_info


def group_specifications(specifications: List[Dict[str, str]]) -> Dict[str, Dict[str, str]]:
    """
    Group product specifications by their group name for easier access.
    
    Args:
        specifications (List[Dict[str, str]]): List of specification dictionaries
        
    Returns:
        Dict[str, Dict[str, str]]: Specifications grouped by category
    """
    grouped = {}
    
    for spec in specifications:
        group = spec.get('group_name', 'Other')
        name = spec.get('name', '')
        value = spec.get('value', '')
        
        if group not in grouped:
            grouped[group] = {}
            
        grouped[group][name] = value
    
    return grouped


def get_primary_image(product: Dict[str, Any]) -> str:
    """
    Get the primary image URL from a product.
    
    Args:
        product (Dict[str, Any]): Product data
        
    Returns:
        str: URL of the primary product image
    """
    # First check for main_image
    if 'main_image' in product and 'link' in product['main_image']:
        return product['main_image']['link']
    
    # Then check for primary_image
    if 'primary_image' in product:
        return product['primary_image']
    
    # Finally check images array
    if 'images' in product:
        # If images is a list of strings
        if product['images'] and isinstance(product['images'][0], str):
            return product['images'][0]
        
        # If images is a list of objects
        elif product['images'] and isinstance(product['images'][0], dict):
            for img in product['images']:
                if img.get('type') == 'primary' or 'primary' in img.get('type', ''):
                    return img.get('link', '')
            
            # If no primary image is found, return the first image
            if product['images'] and 'link' in product['images'][0]:
                return product['images'][0]['link']
    
    return ''


def get_availability_info(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract availability information from an API response.
    
    Args:
        response (Dict[str, Any]): The raw API response
        
    Returns:
        Dict[str, Any]: Formatted availability information
    """
    if not response or 'product' not in response or 'buybox_winner' not in response['product']:
        return {}
    
    if 'fulfillment' not in response['product']['buybox_winner']:
        return {}
    
    fulfillment = response['product']['buybox_winner']['fulfillment']
    
    availability = {
        'available_for_pickup': fulfillment.get('pickup', False),
        'available_for_shipping': fulfillment.get('ship_to_home', False),
        'available_for_delivery': fulfillment.get('scheduled_delivery', False)
    }
    
    # Add pickup details if available
    if 'pickup_info' in fulfillment and fulfillment['pickup_info'].get('in_stock', False):
        availability['pickup_details'] = {
            'store_id': fulfillment['pickup_info'].get('store_id', ''),
            'store_name': fulfillment['pickup_info'].get('store_name', ''),
            'store_state': fulfillment['pickup_info'].get('store_state', ''),
            'stock_level': fulfillment['pickup_info'].get('stock_level', 0)
        }
    
    # Add shipping details if available
    if 'ship_to_home_info' in fulfillment and fulfillment['ship_to_home_info'].get('in_stock', False):
        availability['shipping_details'] = {
            'stock_level': fulfillment['ship_to_home_info'].get('stock_level', 0),
            'shipping_price': fulfillment['ship_to_home_info'].get('price', 0),
            'estimated_delivery': f"{fulfillment['ship_to_home_info'].get('start_date', '')} - "
                                  f"{fulfillment['ship_to_home_info'].get('end_date', '')}"
        }
    
    return availability


def extract_search_products(response: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract products from a search results response.
    
    Args:
        response (Dict[str, Any]): The raw API search response
        
    Returns:
        List[Dict[str, Any]]: List of simplified product information
    """
    if not response or 'search_results' not in response:
        return []
    
    products = []
    
    for result in response['search_results']:
        if 'product' not in result:
            continue
            
        product = result['product']
        
        # Basic product info
        product_info = {
            'position': result.get('position', 0),
            'title': product.get('title', ''),
            'brand': product.get('brand', ''),
            'item_id': product.get('item_id', ''),
            'model_number': product.get('model_number', ''),
            'link': product.get('link', ''),
            'rating': product.get('rating', 0),
            'ratings_total': product.get('ratings_total', 0),
            'is_bestseller': product.get('is_bestseller', False),
            'is_top_rated': product.get('is_top_rated', False),
            'image_url': get_primary_image(product)
        }
        
        # Add price information if available
        if 'offers' in result and 'primary' in result['offers']:
            offer = result['offers']['primary']
            product_info['price'] = {
                'current_price': offer.get('price', 0),
                'currency': offer.get('currency', 'USD'),
                'currency_symbol': offer.get('symbol', '$')
            }
            
            if 'regular_price' in offer:
                product_info['price']['regular_price'] = offer['regular_price']
                product_info['price']['is_on_sale'] = offer['price'] < offer['regular_price']
        
        # Add fulfillment information if available
        if 'fulfillment' in result:
            product_info['availability'] = {
                'available_for_pickup': result['fulfillment'].get('pickup', False),
                'available_for_shipping': result['fulfillment'].get('ship_to_home', False)
            }
        
        # Add features if available
        if 'features' in product:
            product_info['features'] = []
            for feature in product['features']:
                if isinstance(feature, dict) and 'name' in feature and 'value' in feature:
                    product_info['features'].append(f"{feature['name']}: {feature['value']}")
        
        products.append(product_info)
    
    return products


def get_pagination_info(response: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract pagination information from a search response.
    
    Args:
        response (Dict[str, Any]): The raw API search response
        
    Returns:
        Dict[str, Any]: Pagination information
    """
    if not response or 'pagination' not in response:
        return {}
    
    pagination = response['pagination']
    
    info = {
        'total_results': pagination.get('total_results', 0),
        'total_pages': pagination.get('total_pages', 0),
        'current_page': pagination.get('current', {}).get('page', 1)
    }
    
    if 'next' in pagination:
        info['next_page'] = pagination['next'].get('page', None)
        info['next_page_link'] = pagination['next'].get('link', None)
    
    return info
