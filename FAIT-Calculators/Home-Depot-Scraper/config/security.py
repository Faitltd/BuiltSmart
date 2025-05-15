import os
import secrets
import hashlib
from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask import request, jsonify, current_app

# Generate a secure secret key if one doesn't exist
def get_or_create_secret_key():
    secret_key_file = os.path.join(os.path.dirname(__file__), 'secret_key')
    if os.path.exists(secret_key_file):
        with open(secret_key_file, 'r') as f:
            return f.read().strip()
    else:
        # Generate a new secure key
        new_key = secrets.token_hex(32)
        # Save it for future use
        with open(secret_key_file, 'w') as f:
            f.write(new_key)
        return new_key

# Rate limiting configuration
RATE_LIMIT = {
    'default': 100,  # requests per minute
    'api': 300,      # API requests per minute
    'scraper': 50    # Scraper job starts per hour
}

# API key hashing
def hash_api_key(api_key):
    return hashlib.sha256(api_key.encode()).hexdigest()

# JWT token functions
def generate_token(user_id, expiration_hours=24):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=expiration_hours),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    try:
        return jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Authentication decorator
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key is required'}), 401
        
        # Check if API key is valid (implement your validation logic)
        if not is_valid_api_key(api_key):
            return jsonify({'error': 'Invalid API key'}), 401
            
        return f(*args, **kwargs)
    return decorated_function

def is_valid_api_key(api_key):
    # Implement your API key validation logic here
    # For example, check against a database of valid keys
    # This is a placeholder implementation
    valid_keys = os.environ.get('VALID_API_KEYS', '').split(',')
    return api_key in valid_keys

# CORS allowed origins
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5000',
    'https://your-production-domain.com'
]

# Content Security Policy
CSP_POLICY = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    'img-src': ["'self'", 'data:', 'https://www.homedepot.com', 'https://www.lowes.com'],
    'connect-src': ["'self'", 'https://api.homedepot.com', 'https://api.lowes.com']
}

# Security headers
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
}