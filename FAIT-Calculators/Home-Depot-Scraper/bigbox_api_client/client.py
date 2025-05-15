import requests
import json
from typing import Dict, List, Optional, Any, Union


class BigBoxClient:
    """
    Client for interacting with the BigBox API to retrieve Home Depot product data.
    
    This client provides methods to search for products, retrieve product details,
    and handle common API operations with proper error handling.
    """
    
    BASE_URL = "https://api.bigboxapi.com/request"
    
    def __init__(self, api_key: str):
        """
        Initialize the BigBox API client.
        
        Args:
            api_key (str): Your BigBox API key
        """
        self.api_key = api_key
        self.session = requests.Session()
    
    def _make_request(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a request to the BigBox API with the given parameters.
        
        Args:
            params (Dict[str, Any]): Dictionary of request parameters
            
        Returns:
            Dict[str, Any]: The JSON response from the API
            
        Raises:
            requests.HTTPError: If the request fails
            ValueError: If the response cannot be parsed as JSON
            Exception: For other errors in the API response
        """
        # Ensure API key is included in params
        params['api_key'] = self.api_key
        
        try:
            # Make the HTTP GET request
            response = self.session.get(self.BASE_URL, params=params)
            response.raise_for_status()  # Raise exception for 4XX/5XX responses
            
            # Parse the JSON response
            data = response.json()
            
            # Check if the API returned an error
            if not data.get('request_info', {}).get('success', False):
                error_message = data.get('request_info', {}).get('message', 'Unknown API error')
                raise Exception(f"API Error: {error_message}")
                
            return data
        
        except requests.exceptions.RequestException as e:
            # Handle request exceptions (connection errors, timeouts, etc.)
            raise Exception(f"Request failed: {str(e)}")
        
        except json.JSONDecodeError as e:
            # Handle JSON parsing errors
            raise ValueError(f"Failed to parse response as JSON: {str(e)}")
    
    def get_product_by_url(self, url: str) -> Dict[str, Any]:
        """
        Get product information by URL.
        
        Args:
            url (str): The Home Depot product URL
            
        Returns:
            Dict[str, Any]: Product information
        """
        params = {
            'type': 'product',
            'url': url
        }
        
        return self._make_request(params)
    
    def get_product_by_id(self, item_id: str) -> Dict[str, Any]:
        """
        Get product information by item ID.
        
        Args:
            item_id (str): The Home Depot product item ID
            
        Returns:
            Dict[str, Any]: Product information
        """
        params = {
            'type': 'product',
            'item_id': item_id
        }
        
        return self._make_request(params)
    
    def search(self, search_term: str, sort_by: Optional[str] = None, 
               customer_zipcode: Optional[str] = None, page: Optional[int] = None) -> Dict[str, Any]:
        """
        Search for products on Home Depot.
        
        Args:
            search_term (str): The search query
            sort_by (Optional[str]): How to sort the results (e.g. 'best_seller', 'price_low_to_high')
            customer_zipcode (Optional[str]): Zipcode to localize results to
            page (Optional[int]): Page number for paginated results
            
        Returns:
            Dict[str, Any]: Search results
        """
        params = {
            'type': 'search',
            'search_term': search_term
        }
        
        # Add optional parameters if provided
        if sort_by:
            params['sort_by'] = sort_by
        
        if customer_zipcode:
            params['customer_zipcode'] = customer_zipcode
            
        if page and page > 1:
            params['page'] = page
        
        return self._make_request(params)
    
    def get_category(self, category_id: str, sort_by: Optional[str] = None, 
                    customer_zipcode: Optional[str] = None, page: Optional[int] = None) -> Dict[str, Any]:
        """
        Get products from a specific Home Depot category.
        
        Args:
            category_id (str): The Home Depot category ID
            sort_by (Optional[str]): How to sort the results
            customer_zipcode (Optional[str]): Zipcode to localize results to
            page (Optional[int]): Page number for paginated results
            
        Returns:
            Dict[str, Any]: Category results
        """
        params = {
            'type': 'category',
            'category_id': category_id
        }
        
        # Add optional parameters if provided
        if sort_by:
            params['sort_by'] = sort_by
        
        if customer_zipcode:
            params['customer_zipcode'] = customer_zipcode
            
        if page and page > 1:
            params['page'] = page
        
        return self._make_request(params)
    
    def get_reviews(self, item_id: str, sort_by: Optional[str] = None, 
                   page: Optional[int] = None) -> Dict[str, Any]:
        """
        Get reviews for a specific product.
        
        Args:
            item_id (str): The Home Depot product item ID
            sort_by (Optional[str]): How to sort the reviews
            page (Optional[int]): Page number for paginated results
            
        Returns:
            Dict[str, Any]: Product reviews
        """
        params = {
            'type': 'reviews',
            'item_id': item_id
        }
        
        # Add optional parameters if provided
        if sort_by:
            params['sort_by'] = sort_by
            
        if page and page > 1:
            params['page'] = page
        
        return self._make_request(params)
    
    def get_questions(self, item_id: str, page: Optional[int] = None) -> Dict[str, Any]:
        """
        Get questions and answers for a specific product.
        
        Args:
            item_id (str): The Home Depot product item ID
            page (Optional[int]): Page number for paginated results
            
        Returns:
            Dict[str, Any]: Product questions and answers
        """
        params = {
            'type': 'questions',
            'item_id': item_id
        }
        
        # Add optional parameter if provided
        if page and page > 1:
            params['page'] = page
        
        return self._make_request(params)
    
    def get_remaining_credits(self) -> int:
        """
        Get the number of API credits remaining in your account.
        
        Returns:
            int: Number of credits remaining
        """
        # Make a simple request to check credits
        params = {
            'type': 'product',
            'item_id': '1000000000'  # Use any valid ID that will process quickly
        }
        
        try:
            response = self._make_request(params)
            return response.get('request_info', {}).get('credits_remaining', 0)
        except Exception:
            # If the request fails, return 0 as a safe default
            return 0
