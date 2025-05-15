import logging
import traceback
import os
import json
from datetime import datetime
from functools import wraps
from flask import jsonify, request

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Create logger
logger = logging.getLogger('scraper')
logger.setLevel(logging.INFO)

# Create handlers
error_handler = logging.FileHandler(os.path.join(log_dir, 'error.log'))
error_handler.setLevel(logging.ERROR)

info_handler = logging.FileHandler(os.path.join(log_dir, 'info.log'))
info_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create formatters and add to handlers
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
error_handler.setFormatter(formatter)
info_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to logger
logger.addHandler(error_handler)
logger.addHandler(info_handler)
logger.addHandler(console_handler)

# Error classes
class ScraperError(Exception):
    """Base class for scraper errors"""
    def __init__(self, message, status_code=500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class APIError(ScraperError):
    """Error for API-related issues"""
    pass

class ValidationError(ScraperError):
    """Error for validation failures"""
    def __init__(self, message, status_code=400):
        super().__init__(message, status_code)

class AuthenticationError(ScraperError):
    """Error for authentication failures"""
    def __init__(self, message, status_code=401):
        super().__init__(message, status_code)

class RateLimitError(ScraperError):
    """Error for rate limit exceeded"""
    def __init__(self, message, status_code=429):
        super().__init__(message, status_code)

# Error handler decorator
def handle_errors(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ScraperError as e:
            logger.error(f"{e.__class__.__name__}: {e.message}")
            return jsonify({
                'error': e.message,
                'error_type': e.__class__.__name__
            }), e.status_code
        except Exception as e:
            # Log the full traceback for unexpected errors
            logger.error(f"Unexpected error: {str(e)}\n{traceback.format_exc()}")
            return jsonify({
                'error': 'An unexpected error occurred',
                'error_type': 'ServerError'
            }), 500
    return decorated_function

# Function to log API requests
def log_api_request(response):
    # Don't log health check endpoints
    if request.path == '/health' or request.path == '/api/health':
        return response
    
    # Log the request details
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'method': request.method,
        'path': request.path,
        'ip': request.remote_addr,
        'user_agent': request.user_agent.string,
        'status_code': response.status_code
    }
    
    # Add request parameters if any (but filter out sensitive data)
    if request.args:
        log_data['query_params'] = {k: v for k, v in request.args.items() 
                                   if k.lower() not in ['api_key', 'token', 'password']}
    
    # Log the data
    if 200 <= response.status_code < 400:
        logger.info(f"API Request: {json.dumps(log_data)}")
    else:
        logger.error(f"API Error: {json.dumps(log_data)}")
    
    return response