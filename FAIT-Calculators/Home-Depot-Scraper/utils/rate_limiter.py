import time
import threading
from collections import defaultdict
from functools import wraps
from flask import request, jsonify, g
from .error_handler import RateLimitError, logger

# Simple in-memory rate limiter
class RateLimiter:
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
    
    def check_rate_limit(self, key, limit, window):
        """
        Check if the rate limit has been exceeded
        
        Args:
            key: The key to rate limit on (e.g., IP address)
            limit: Maximum number of requests allowed in the window
            window: Time window in seconds
        
        Returns:
            tuple: (allowed, remaining, reset_time)
        """
        current_time = time.time()
        
        with self.lock:
            # Remove expired timestamps
            self.requests[key] = [t for t in self.requests[key] if t > current_time - window]
            
            # Check if we're over the limit
            if len(self.requests[key]) >= limit:
                reset_time = self.requests[key][0] + window
                return False, 0, reset_time
            
            # Add the current request timestamp
            self.requests[key].append(current_time)
            
            # Calculate remaining requests and reset time
            remaining = limit - len(self.requests[key])
            reset_time = current_time + window
            
            return True, remaining, reset_time

# Create a global rate limiter instance
rate_limiter = RateLimiter()

# Rate limit decorator
def rate_limit(limit=100, window=60, key_func=None):
    """
    Rate limiting decorator
    
    Args:
        limit: Maximum number of requests allowed in the window
        window: Time window in seconds
        key_func: Function to generate the rate limit key (defaults to IP address)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get the rate limit key
            if key_func:
                key = key_func()
            else:
                key = request.remote_addr
            
            # Check the rate limit
            allowed, remaining, reset_time = rate_limiter.check_rate_limit(key, limit, window)
            
            # Set rate limit headers
            g.rate_limit_remaining = remaining
            g.rate_limit_reset = reset_time
            
            if not allowed:
                logger.warning(f"Rate limit exceeded for {key}")
                raise RateLimitError(f"Rate limit exceeded. Try again after {int(reset_time - time.time())} seconds.")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Function to add rate limit headers to responses
def add_rate_limit_headers(response):
    if hasattr(g, 'rate_limit_remaining') and hasattr(g, 'rate_limit_reset'):
        response.headers['X-RateLimit-Remaining'] = str(g.rate_limit_remaining)
        response.headers['X-RateLimit-Reset'] = str(int(g.rate_limit_reset))
    return response