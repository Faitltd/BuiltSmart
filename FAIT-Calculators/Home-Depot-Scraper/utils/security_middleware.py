from functools import wraps
from flask import request, jsonify, current_app, g
import re
import time
import hashlib
import hmac
import base64
from .error_handler import AuthenticationError, ValidationError

def add_security_headers(response):
    """Add security headers to the response"""
    # Content Security Policy
    csp = "; ".join([
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
        "img-src 'self' data: https://www.homedepot.com https://www.lowes.com",
        "connect-src 'self' https://api.homedepot.com https://api.lowes.com"
    ])
    
    # Set security headers
    response.headers['Content-Security-Policy'] = csp
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    return response

def require_api_key(f):
    """Decorator to require API key authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            raise AuthenticationError("API key is required")
        
        # Check if API key is valid
        if not is_valid_api_key(api_key):
            raise AuthenticationError("Invalid API key")
        
        # Store the API key for potential use in the view
        g.api_key = api_key
        
        return f(*args, **kwargs)
    return decorated_function

def is_valid_api_key(api_key):
    """Check if an API key is valid"""
    # In a real application, you would check against a database
    # For this example, we'll use a simple environment variable
    valid_keys = current_app.config.get('VALID_API_KEYS', '').split(',')
    return api_key in valid_keys

def validate_request_data(schema):
    """Decorator to validate request data against a schema"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get request data based on content type
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form.to_dict()
            
            # Validate data against schema
            try:
                validated_data = schema.validate(data)
                g.validated_data = validated_data
            except Exception as e:
                raise ValidationError(f"Invalid request data: {str(e)}")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def verify_webhook_signature(secret_key_func):
    """
    Decorator to verify webhook signatures
    
    Args:
        secret_key_func: Function that returns the secret key for the webhook
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get the signature from the request
            signature = request.headers.get('X-Webhook-Signature')
            if not signature:
                raise AuthenticationError("Webhook signature is missing")
            
            # Get the secret key
            secret_key = secret_key_func()
            if not secret_key:
                raise AuthenticationError("Webhook secret key is not configured")
            
            # Get the request body
            payload = request.get_data()
            
            # Verify the signature
            expected_signature = hmac.new(
                secret_key.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(signature, expected_signature):
                raise AuthenticationError("Invalid webhook signature")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def sanitize_input(input_string):
    """Sanitize user input to prevent XSS and injection attacks"""
    if not input_string:
        return input_string
    
    # Remove potentially dangerous characters
    sanitized = re.sub(r'[<>{}|\\^`]', '', input_string)
    
    # Limit length
    max_length = 1000  # Adjust as needed
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized