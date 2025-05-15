import re
import os
from urllib.parse import urlparse
from .error_handler import ValidationError

def validate_url(url):
    """Validate a URL"""
    if not url:
        raise ValidationError("URL cannot be empty")
    
    try:
        result = urlparse(url)
        if not all([result.scheme, result.netloc]):
            raise ValidationError(f"Invalid URL format: {url}")
        
        # Check if it's a Home Depot or Lowes URL
        if not (result.netloc == 'www.homedepot.com' or 
                result.netloc == 'homedepot.com' or
                result.netloc == 'www.lowes.com' or
                result.netloc == 'lowes.com'):
            raise ValidationError(f"URL must be from Home Depot or Lowes: {url}")
        
        return url
    except Exception as e:
        if isinstance(e, ValidationError):
            raise
        raise ValidationError(f"Invalid URL: {url}")

def validate_search_term(term):
    """Validate a search term"""
    if not term or not term.strip():
        raise ValidationError("Search term cannot be empty")
    
    if len(term) < 2:
        raise ValidationError("Search term must be at least 2 characters long")
    
    if len(term) > 100:
        raise ValidationError("Search term cannot exceed 100 characters")
    
    # Check for potentially harmful characters
    if re.search(r'[<>{}|\\^`]', term):
        raise ValidationError("Search term contains invalid characters")
    
    return term.strip()

def validate_category(category, valid_categories):
    """Validate a category"""
    if not category:
        raise ValidationError("Category cannot be empty")
    
    if category not in valid_categories:
        raise ValidationError(f"Invalid category: {category}")
    
    return category

def validate_output_dir(directory):
    """Validate an output directory"""
    if not directory:
        raise ValidationError("Output directory cannot be empty")
    
    # Create the directory if it doesn't exist
    try:
        os.makedirs(directory, exist_ok=True)
    except Exception as e:
        raise ValidationError(f"Failed to create output directory: {str(e)}")
    
    # Check if the directory is writable
    if not os.access(directory, os.W_OK):
        raise ValidationError(f"Output directory is not writable: {directory}")
    
    return directory

def validate_max_pages(max_pages):
    """Validate max pages parameter"""
    try:
        max_pages = int(max_pages)
        if max_pages < 1:
            raise ValidationError("Max pages must be at least 1")
        if max_pages > 100:
            raise ValidationError("Max pages cannot exceed 100")
        return max_pages
    except ValueError:
        raise ValidationError("Max pages must be a valid integer")

def validate_max_products(max_products):
    """Validate max products parameter"""
    try:
        max_products = int(max_products)
        if max_products < 1:
            raise ValidationError("Max products must be at least 1")
        if max_products > 1000:
            raise ValidationError("Max products cannot exceed 1000")
        return max_products
    except ValueError:
        raise ValidationError("Max products must be a valid integer")

def validate_output_format(output_format, valid_formats=None):
    """Validate output format"""
    if valid_formats is None:
        valid_formats = ['csv', 'json', 'excel']
    
    if not output_format:
        raise ValidationError("Output format cannot be empty")
    
    if output_format not in valid_formats:
        raise ValidationError(f"Invalid output format: {output_format}")
    
    return output_format

def validate_job_config(config):
    """Validate a complete job configuration"""
    errors = []
    
    # Validate search type
    search_type = config.get('search_type')
    if search_type not in ['search_term', 'category', 'url_list']:
        errors.append("Invalid search type")
    
    # Validate based on search type
    if search_type == 'search_term':
        search_terms = config.get('search_terms', [])
        if not search_terms:
            errors.append("At least one search term is required")
        for term in search_terms:
            try:
                validate_search_term(term)
            except ValidationError as e:
                errors.append(str(e))
    
    elif search_type == 'category':
        try:
            # We'll need to pass valid categories from the caller
            validate_category(config.get('category'), config.get('valid_categories', []))
        except ValidationError as e:
            errors.append(str(e))
    
    elif search_type == 'url_list':
        urls = config.get('urls', [])
        if not urls:
            errors.append("At least one URL is required")
        for url in urls:
            try:
                validate_url(url)
            except ValidationError as e:
                errors.append(str(e))
    
    # Validate common parameters
    try:
        validate_output_dir(config.get('output_dir', 'data'))
    except ValidationError as e:
        errors.append(str(e))
    
    try:
        validate_max_pages(config.get('max_pages', 10))
    except ValidationError as e:
        errors.append(str(e))
    
    try:
        validate_max_products(config.get('max_products', 100))
    except ValidationError as e:
        errors.append(str(e))
    
    try:
        validate_output_format(config.get('output_format', 'csv'))
    except ValidationError as e:
        errors.append(str(e))
    
    if errors:
        raise ValidationError(f"Invalid job configuration: {'; '.join(errors)}")
    
    return config