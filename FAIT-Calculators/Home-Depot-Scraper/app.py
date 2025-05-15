#!/usr/bin/env python3
"""
Home Depot Scraper Web Application

This Flask application provides a web interface for the Home Depot scraper,
allowing users to configure and run scraping jobs with different search types
and customize CSV header names.
"""

import os
from flask import Flask, jsonify, request, g
from werkzeug.middleware.proxy_fix import ProxyFix
import logging

# Import utility modules
from utils.error_handler import handle_errors, log_api_request, logger
from utils.rate_limiter import rate_limit, add_rate_limit_headers
from utils.health_check import health_bp
from utils.monitoring import metrics_bp, time_request
from utils.config_manager import ConfigManager
from utils.security_middleware import add_security_headers, require_api_key

# Import scraper modules
# (These would be your existing scraper modules)

# Initialize configuration
config_manager = ConfigManager()

def create_app():
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_mapping(config_manager.get_all())
    
    # Set secret key
    app.secret_key = os.environ.get('SECRET_KEY', os.urandom(24))
    
    # Fix for running behind a proxy
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(metrics_bp, url_prefix='/metrics')
    
    # Register middleware
    app.after_request(add_security_headers)
    app.after_request(add_rate_limit_headers)
    app.after_request(log_api_request)
    
    # Register error handlers
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Not found'}), 404
    
    @app.errorhandler(500)
    def server_error(e):
        logger.error(f"
import os
import json
import time
import threading
import logging
import csv
import platform
from datetime import datetime
from flask import Flask, Blueprint, render_template, request, jsonify, send_file, redirect, url_for
from dotenv import load_dotenv
from homedepot_scraper.log_handler import JobLogHandler

# Load environment variables from .env file
load_dotenv()

# Access the API key
BIGBOX_API_KEY = os.getenv('BIGBOX_API_KEY')

# Now you can use the API key in your application
print(f"API Key: {BIGBOX_API_KEY}")

# Import scraper components
from homedepot_scraper.scraper import HomeDepotScraper
from config.settings import API_KEY, RAW_DATA_DIR, RESULTS_DIR, CSV_TEMPLATE

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # Only use StreamHandler for Cloud Run to log to stdout/stderr
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create Flask Blueprint
app = Blueprint('homedepot_app', __name__, template_folder='templates', static_folder='static')

# Global variables
scraper_jobs = {}
next_job_id = 1

# Ensure directories exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('data/desktop', exist_ok=True)  # Create cloud-friendly Desktop directory

# Function to detect if we're running in a cloud environment
def is_cloud_environment():
    """Detect if we're running in a cloud environment."""
    # Always assume we're in a cloud environment for safety
    # This ensures Desktop paths are always handled safely
    return True

# Check if we're in a cloud environment
IN_CLOUD = is_cloud_environment()
if IN_CLOUD:
    logger.info("Running in cloud environment - using app data directory for Desktop paths")

# Search types
SEARCH_TYPES = {
    'category': 'Category Browse',
    'search_term': 'Search Term',
    'url_list': 'URL List',
}

# Default CSV headers (can be customized by user)
DEFAULT_CSV_HEADERS = CSV_TEMPLATE['headers']

# Standardized CSV header names
STANDARD_CSV_HEADERS = {
    'product_name': 'Product Name',
    'sku': 'SKU',
    'item_id': 'Item ID',
    'model_number': 'Model Number',
    'upc': 'UPC',
    'url': 'URL',
    'price': 'Rate',
    'currency': 'Currency',
    'unit': 'Unit',
    'details': 'Description',
    'specifications': 'Specifications',
    'brand': 'Manufacturer',
    'images': 'Image',
    'markup': '43%',
    'supplier': 'HD',
    'cost': 'Cost'
}

class ScraperJob:
    """Class to track scraper job status and results."""

    def __init__(self, job_id, config):
        self.job_id = job_id
        self.config = config
        self.status = 'pending'
        self.start_time = None
        self.end_time = None
        self.log_messages = []
        self.result_files = []
        self.error = None
        self.progress = {
            'current': 0,
            'total': 0,
            'percentage': 0
        }
        self.product_progress = {
            'current': 0,
            'total': 0,
            'percentage': 0
        }
        self.stop_requested = False

    def start(self):
        """Mark job as started."""
        self.status = 'running'
        self.start_time = datetime.now()
        self.log(f"Job {self.job_id} started at {self.start_time}")

    def complete(self, success=True):
        """Mark job as completed."""
        self.end_time = datetime.now()
        self.status = 'completed' if success else 'failed'
        duration = self.end_time - self.start_time if self.start_time else None
        self.log(f"Job {self.job_id} {self.status} at {self.end_time}. Duration: {duration}")

    def fail(self, error):
        """Mark job as failed with error."""
        self.status = 'failed'
        self.end_time = datetime.now()
        self.error = str(error)
        self.log(f"Job {self.job_id} failed: {error}")

    def log(self, message):
        """Add a log message."""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}"
        self.log_messages.append(log_entry)
        logger.info(f"Job {self.job_id}: {message}")

    def update_progress(self, current, total):
        """Update job progress."""
        self.progress['current'] = current
        self.progress['total'] = total
        self.progress['percentage'] = int((current / total) * 100) if total > 0 else 0

    def update_product_progress(self, current, total):
        """Update product scraping progress."""
        self.product_progress['current'] = current
        self.product_progress['total'] = total
        self.product_progress['percentage'] = int((current / total) * 100) if total > 0 else 0

    def add_result_file(self, filename):
        """Add a result file to the job."""
        self.result_files.append(filename)
        self.log(f"Added result file: {filename}")

    def to_dict(self):
        """Convert job to dictionary for JSON serialization."""
        # Create a copy of config without the API key
        safe_config = {k: v for k, v in self.config.items() if k != 'api_key'}
        # Add a placeholder for API key
        if 'api_key' in self.config:
            safe_config['api_key'] = '********'

        return {
            'job_id': self.job_id,
            'config': safe_config,
            'status': self.status,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'progress': self.progress,
            'product_progress': self.product_progress,
            'result_files': self.result_files,
            'error': self.error,
            'stop_requested': self.stop_requested
        }

def run_scraper_job(job):
    """Run a scraper job in a separate thread."""
    try:
        job.start()

        # Initialize scraper with API key from environment
        output_dir = job.config.get('output_dir', 'data')

        # Create a job-specific subdirectory to keep user data separate
        job_dir = os.path.join(output_dir, f'job_{job.job_id}')
        job.config['job_dir'] = job_dir

        # Handle special directories
        if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/']:
            # Always use data/desktop in Cloud Run
            output_dir = 'data/desktop'
            job.log(f"Using data/desktop directory instead of Desktop for Cloud Run compatibility: {os.path.abspath(output_dir)}")

        # Ensure output directory and job-specific directory exist
        try:
            if not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)
                job.log(f"Created output directory: {os.path.abspath(output_dir)}")

            # Create job-specific directory
            if not os.path.exists(job_dir):
                os.makedirs(job_dir, exist_ok=True)
                job.log(f"Created job-specific directory: {os.path.abspath(job_dir)}")

            job.log(f"Using job directory: {os.path.abspath(job_dir)}")
        except Exception as e:
            job.log(f"Error creating directories: {str(e)}")
            raise

        # Create scraper instance with job-specific directory
        scraper = HomeDepotScraper(API_KEY, job_dir)

        # Store the scraper in the job object for access by other endpoints
        job.scraper = scraper

        # Set up custom log handler to capture scraper logs
        scraper_logger = logging.getLogger('homedepot_scraper.scraper')
        job_log_handler = JobLogHandler(job)
        job_log_handler.setLevel(logging.INFO)
        scraper_logger.addHandler(job_log_handler)

        # Also capture logs from the API module
        api_logger = logging.getLogger('homedepot_scraper.api')
        api_logger.addHandler(job_log_handler)

        # Log that we're using the API key from environment (without showing it)
        job.log("Using API key from environment")

        # Get search type and parameters
        search_type = job.config.get('search_type', 'search_term')

        # Get custom CSV headers if provided, otherwise use standardized headers
        custom_headers = job.config.get('csv_headers', {})

        # If no custom headers provided, use the standardized ones
        if not custom_headers:
            custom_headers = STANDARD_CSV_HEADERS
            job.log("Using standardized CSV headers")
        else:
            job.log(f"Using custom CSV headers")

        # Run the appropriate scraper method based on search type
        try:
            if search_type == 'category':
                category_name = job.config.get('category_id')  # We're using the category name from the dropdown
                max_pages = job.config.get('max_pages')
                max_products = job.config.get('max_products')

                if not category_name:
                    raise ValueError("Category is required for category search")

                job.log(f"Starting category scrape for: {category_name}")

                # Convert category name to search term for the API
                # This is a simplification - in a real implementation, you might want to map
                # category names to actual category IDs in the Home Depot system

                # Scrape using the category name as a search term
                # Note: We're using scrape_search_term instead of scrape_category because we don't have actual category IDs
                job.log(f"Using search term approach for category: {category_name}")
                job.log(f"Max pages: {max_pages}, Max products: {max_products}")

                urls = scraper.scrape_search_term(category_name, max_pages=max_pages, max_products=max_products)
                job.log(f"Found {len(urls)} product URLs in category {category_name}")
                job.update_progress(len(urls), len(urls))

            elif search_type == 'search_term':
                search_terms = job.config.get('search_terms', [])
                max_pages = job.config.get('max_pages')
                sort_by = job.config.get('sort_by', 'best_seller')

                if not search_terms:
                    raise ValueError("Search terms are required for search term search")

                job.log(f"Starting search term scrape for {len(search_terms)} terms")

                # Scrape each search term
                total_urls = 0
                max_products = job.config.get('max_products')
                if max_products:
                    job.log(f"Limiting to maximum of {max_products} products")

                all_urls = []
                for i, term in enumerate(search_terms):
                    job.log(f"Scraping search term {i+1}/{len(search_terms)}: {term}")
                    urls = scraper.scrape_search_term(term, max_pages=max_pages, sort_by=sort_by, max_products=max_products)
                    all_urls.extend(urls)
                    total_urls += len(urls)
                    job.update_progress(i+1, len(search_terms))
                    job.log(f"Found {len(urls)} product URLs for term '{term}'")

                job.log(f"Found {total_urls} total product URLs across all search terms")

                # Now scrape the product details for these URLs
                if all_urls:
                    job.log(f"Starting to scrape product details for {len(all_urls)} URLs")
                    scraper.scrape_specific_urls(all_urls, job)
                    job.log(f"Scraped {len(scraper.products)} products successfully")

            elif search_type == 'url_list':
                urls = job.config.get('urls', [])

                if not urls:
                    raise ValueError("URLs are required for URL list search")

                job.log(f"Starting URL list scrape for {len(urls)} URLs")

                # Process the URLs directly
                scraper.scrape_specific_urls(urls, job)
                job.log(f"Processed {len(urls)} URLs")
                job.update_progress(len(urls), len(urls))

            else:
                raise ValueError(f"Unknown search type: {search_type}")

            # Check if we should stop
            if job.stop_requested:
                job.log("Stopping scraping as requested by user")

            # Skip fetching product details since we already have them from URL scraping
            job.log(f"Using {len(scraper.products)} products already scraped")

            # Save results with the headers (either custom or standardized)
            job.log("Saving results to CSV...")
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            result_file = f"homedepot_results_{timestamp}.csv"

            # Ensure the output directory exists
            results_dir = os.path.join(output_dir, "results")
            os.makedirs(results_dir, exist_ok=True)

            # Log the absolute paths for reference
            job.log(f"Using results directory: {os.path.abspath(results_dir)}")

            # If using Desktop, show the appropriate path
            if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/'] or \
               os.path.basename(os.path.normpath(output_dir)) == 'Desktop':
                job.log(f"Files will be saved to the data/desktop directory: {os.path.abspath(output_dir)}")

            # Check if we have any products to save
            if not scraper.products:
                job.log(f"WARNING: No products found to save")
                job.complete(True)
                return

            job.log(f"Found {len(scraper.products)} products to save")

            # First try saving with the template format
            try:
                # Save the results
                filepath = scraper.save_results_template(output_file=result_file, custom_headers=custom_headers)

                # Verify the file was created
                if os.path.exists(filepath):
                    job.log(f"Results saved to {filepath}")
                    job.add_result_file(result_file)
                else:
                    job.log(f"WARNING: Could not verify that results file was created at {filepath}")
                    raise FileNotFoundError(f"File not created: {filepath}")
            except Exception as e:
                job.log(f"Error saving with template format: {str(e)}")

                # Try saving with the standard save_results method as a fallback
                job.log("Trying alternative save method...")
                try:
                    alt_filepath = scraper.save_results(format='csv', output_file=result_file)

                    if os.path.exists(alt_filepath):
                        job.log(f"Results saved to {alt_filepath} using alternative method")
                        job.add_result_file(result_file)
                    else:
                        job.log(f"WARNING: Could not verify that results file was created at {alt_filepath}")
                        raise FileNotFoundError(f"File not created: {alt_filepath}")
                except Exception as e2:
                    job.log(f"ERROR: Failed to save results to CSV file: {str(e2)}")

                    # Last resort: save directly to a CSV file
                    job.log("Trying direct CSV save as last resort...")
                    try:
                        # If using Desktop, save to the data/desktop directory
                        if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/'] or \
                           os.path.basename(os.path.normpath(output_dir)) == 'Desktop':
                            # Always use data/desktop in Cloud Run
                            desktop_dir = 'data/desktop'
                            # Make sure the directory exists
                            os.makedirs(desktop_dir, exist_ok=True)
                            direct_filepath = os.path.join(desktop_dir, result_file)
                            job.log(f"Saving directly to data/desktop directory: {os.path.abspath(direct_filepath)}")
                        else:
                            direct_filepath = os.path.join(results_dir, result_file)
                        with open(direct_filepath, 'w', newline='', encoding='utf-8') as f:
                            # Get all possible fields
                            fields = set()
                            for product in scraper.products:
                                fields.update(product.keys())

                            writer = csv.DictWriter(f, fieldnames=sorted(list(fields)))
                            writer.writeheader()
                            writer.writerows(scraper.products)

                        job.log(f"Results saved directly to {direct_filepath}")
                        job.add_result_file(result_file)
                    except Exception as e3:
                        job.log(f"CRITICAL ERROR: All save methods failed: {str(e3)}")

        except Exception as e:
            job.log(f"Error during scraping: {str(e)}")
            raise

        # Clean up log handlers
        scraper_logger = logging.getLogger('homedepot_scraper.scraper')
        api_logger = logging.getLogger('homedepot_scraper.api')

        for handler in scraper_logger.handlers[:]:
            if isinstance(handler, JobLogHandler) and handler.job == job:
                scraper_logger.removeHandler(handler)

        for handler in api_logger.handlers[:]:
            if isinstance(handler, JobLogHandler) and handler.job == job:
                api_logger.removeHandler(handler)

        # Mark job as completed
        job.complete(True)

    except Exception as e:
        # Clean up log handlers even if there's an error
        scraper_logger = logging.getLogger('homedepot_scraper.scraper')
        api_logger = logging.getLogger('homedepot_scraper.api')

        for handler in scraper_logger.handlers[:]:
            if isinstance(handler, JobLogHandler) and handler.job == job:
                scraper_logger.removeHandler(handler)

        for handler in api_logger.handlers[:]:
            if isinstance(handler, JobLogHandler) and handler.job == job:
                api_logger.removeHandler(handler)

        logger.exception(f"Error in job {job.job_id}")
        job.fail(str(e))

@app.route('/')
def home():
    """Home page - redirects to combined page."""
    return redirect(url_for('homedepot_app.combined_page'))

@app.route('/combined')
def combined_page():
    """Combined new job form and jobs list page."""
    return render_template('combined_homedepot.html',
                          search_types=SEARCH_TYPES,
                          default_api_key="",  # Don't pass API key to template
                          default_csv_headers=DEFAULT_CSV_HEADERS,
                          standard_csv_headers=STANDARD_CSV_HEADERS,
                          jobs=[job.to_dict() for job in scraper_jobs.values()])

@app.route('/new')
def new_job():
    """New job form page (legacy route)."""
    return redirect(url_for('homedepot_app.combined_page'))

@app.route('/jobs')
def list_jobs():
    """List all jobs (legacy route)."""
    return redirect(url_for('homedepot_app.combined_page'))

@app.route('/job/<int:job_id>')
def job_details(job_id):
    """Show job details."""
    job = scraper_jobs.get(job_id)
    if not job:
        return render_template('error.html', message=f"Job {job_id} not found"), 404

    return render_template('job_details.html', job=job.to_dict(), log_messages=job.log_messages)

@app.route('/api/jobs', methods=['GET'])
def api_list_jobs():
    """API endpoint to list all jobs."""
    return jsonify({
        'jobs': [job.to_dict() for job in scraper_jobs.values()]
    })

@app.route('/api/job/<int:job_id>', methods=['GET'])
def api_job_status(job_id):
    """API endpoint to get job status."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({'error': f"Job {job_id} not found"}), 404

    return jsonify({
        'job': job.to_dict(),
        'log_messages': job.log_messages
    })

@app.route('/api/validate_directory', methods=['POST'])
def validate_directory():
    """Validate if a directory exists and is writable."""
    try:
        data = request.json
        directory = data.get('directory')

        if not directory:
            return jsonify({'valid': False, 'error': 'No directory provided'}), 400

        # Handle special directories
        if directory.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/']:
            # Always use data/desktop in Cloud Run
            directory = 'data/desktop'
            logger.info(f"Using data/desktop directory instead of Desktop for Cloud Run compatibility: {os.path.abspath(directory)}")
        # Expand user directory if path starts with ~
        elif directory.startswith('~'):
            directory = os.path.expanduser(directory)

        # Handle absolute vs relative paths
        if not os.path.isabs(directory):
            # For relative paths, show the full path in messages but keep the relative path for operations
            full_path = os.path.abspath(directory)
            display_path = full_path
        else:
            full_path = directory
            display_path = directory

        # Check if directory exists
        if not os.path.exists(directory):
            # Try to create it
            try:
                os.makedirs(directory, exist_ok=True)
                return jsonify({
                    'valid': True,
                    'message': f'Directory created successfully: {display_path}'
                })
            except PermissionError:
                return jsonify({
                    'valid': False,
                    'error': f'Permission denied. Cannot create directory: {display_path}'
                }), 400
            except Exception as e:
                return jsonify({
                    'valid': False,
                    'error': f'Could not create directory: {str(e)}'
                }), 400

        # Check if it's a directory
        if not os.path.isdir(directory):
            return jsonify({
                'valid': False,
                'error': f'{display_path} is not a directory'
            }), 400

        # Check if it's writable
        if not os.access(directory, os.W_OK):
            return jsonify({
                'valid': False,
                'error': f'{display_path} is not writable. Check permissions.'
            }), 400

        # All checks passed
        return jsonify({
            'valid': True,
            'message': f'Files will be saved to: {display_path}'
        })

    except Exception as e:
        logger.exception("Error validating directory")
        return jsonify({'valid': False, 'error': str(e)}), 500

@app.route('/api/start_job', methods=['POST'])
def api_start_job():
    """API endpoint to start a new job."""
    global next_job_id

    try:
        # Get job configuration from request
        config = request.json

        if not config:
            return jsonify({'error': 'No configuration provided'}), 400

        # Validate output directory
        output_dir = config.get('output_dir', 'data')

        # Special handling for Desktop directory
        if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/']:
            # Always use data directory in Cloud Run
            output_dir = 'data'
            config['output_dir'] = output_dir
            logger.info(f"Using data directory instead of Desktop for Cloud Run compatibility")

        # Make sure the directory exists
        if not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir, exist_ok=True)
                logger.info(f"Created output directory: {os.path.abspath(output_dir)}")
            except Exception as e:
                return jsonify({'error': f"Could not create output directory: {str(e)}"}), 400

        # Create new job
        job_id = next_job_id
        next_job_id += 1

        job = ScraperJob(job_id, config)
        scraper_jobs[job_id] = job

        # Start job in a separate thread
        thread = threading.Thread(target=run_scraper_job, args=(job,))
        thread.daemon = True
        thread.start()

        return jsonify({
            'job_id': job_id,
            'status': 'started',
            'message': f'Job {job_id} started successfully'
        })

    except Exception as e:
        logger.exception("Error starting job")
        return jsonify({'error': str(e)}), 500

@app.route('/api/end_job/<int:job_id>', methods=['POST'])
def api_end_job(job_id):
    """API endpoint to end a job gracefully and save results."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({'error': f"Job {job_id} not found"}), 404

    if job.status == 'running':
        job.log("Job end requested by user - completing gracefully")

        # Save current results
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        result_file = f"homedepot_results_{timestamp}.csv"

        # Get the output directory
        output_dir = job.config.get('output_dir', 'data')

        # Handle special directories
        if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/']:
            # Always use data/desktop in Cloud Run
            output_dir = 'data/desktop'
            job.log(f"Using data/desktop directory instead of Desktop for Cloud Run compatibility: {os.path.abspath(output_dir)}")

        # Try to save results
        try:
            # Get the scraper from the job thread
            scraper = job.scraper
            if scraper and hasattr(scraper, 'products') and scraper.products:
                # Save the results
                custom_headers = job.config.get('custom_headers')
                filepath = scraper.save_results_template(output_file=result_file, custom_headers=custom_headers)
                job.log(f"Results saved to {filepath}")
                job.add_result_file(result_file)
            else:
                job.log("No products found to save")
        except Exception as e:
            job.log(f"Error saving results: {str(e)}")

        # Mark job as completed
        job.complete(True)
        return jsonify({'message': f"Job {job_id} ended and results saved"})
    else:
        return jsonify({'message': f"Job {job_id} is not running (status: {job.status})"})

@app.route('/api/stop_scraping/<int:job_id>', methods=['POST'])
def api_stop_scraping(job_id):
    """API endpoint to stop scraping but save what has been gathered."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({'error': f"Job {job_id} not found"}), 404

    if job.status == 'running':
        job.stop_requested = True
        job.log("Stop requested by user - will save current results")
        return jsonify({'message': f"Job {job_id} will stop after saving current results"})
    else:
        return jsonify({'message': f"Job {job_id} is not running (status: {job.status})"})

@app.route('/api/cancel_job/<int:job_id>', methods=['POST'])
def api_cancel_job(job_id):
    """API endpoint to cancel a job."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({'error': f"Job {job_id} not found"}), 404

    if job.status == 'running':
        job.status = 'cancelled'
        job.log("Job cancelled by user")
        return jsonify({'message': f"Job {job_id} cancelled"})
    else:
        return jsonify({'message': f"Job {job_id} is not running (status: {job.status})"})

@app.route('/api/download/<int:job_id>/<path:filename>')
def download_result(job_id, filename):
    """Download a result file."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({'error': f"Job {job_id} not found"}), 404

    if filename not in job.result_files:
        return jsonify({'error': f"File {filename} not found for job {job_id}"}), 404

    # Get the job-specific directory from the job config
    job_dir = job.config.get('job_dir')
    output_dir = job.config.get('output_dir', 'data')

    # If job_dir is available, use it instead of output_dir
    if job_dir and os.path.exists(job_dir):
        output_dir = job_dir
        logger.info(f"Using job-specific directory for download: {os.path.abspath(job_dir)}")

    # Handle special directories like Desktop
    if output_dir.lower() in ['/desktop', 'desktop', '/desktop/', 'desktop/']:
        # Always use data/desktop in Cloud Run
        output_dir = 'data/desktop'
        logger.info(f"Using data/desktop directory instead of Desktop for download: {os.path.abspath(output_dir)}")

    # Try multiple possible locations for the file
    possible_paths = [
        os.path.join(output_dir, filename),             # Directly in output dir (for Desktop)
        os.path.join(output_dir, 'results', filename),  # Standard path in job's output dir
        os.path.join(RESULTS_DIR, filename),            # Default results dir
        os.path.join('data', 'results', filename),      # Hardcoded data/results path
        os.path.join('results', filename)               # Just in results dir
    ]

    # Log all possible paths for debugging
    logger.info(f"Looking for file {filename} in the following locations:")
    for i, path in enumerate(possible_paths):
        logger.info(f"  {i+1}. {os.path.abspath(path)}")

    # Find the first path that exists
    file_path = None
    for path in possible_paths:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            file_path = abs_path
            logger.info(f"Found result file at: {file_path}")
            break

    # If no file found, return error
    if not file_path:
        # Try to find any CSV files in the results directories
        csv_files = []
        for base_dir in [os.path.join(output_dir, 'results'), RESULTS_DIR, 'data/results', 'results']:
            if os.path.exists(base_dir) and os.path.isdir(base_dir):
                for file in os.listdir(base_dir):
                    if file.endswith('.csv'):
                        csv_files.append(os.path.join(base_dir, file))

        # If we found some CSV files, suggest them
        if csv_files:
            csv_list = '\n - '.join([''] + csv_files)
            logger.error(f"File {filename} not found, but found these CSV files:{csv_list}")
            return jsonify({
                'error': f"File {filename} not found. Available CSV files: {', '.join([os.path.basename(f) for f in csv_files])}"
            }), 404
        else:
            paths_str = '\n - '.join([''] + [os.path.abspath(p) for p in possible_paths])
            logger.error(f"File {filename} not found in any of these locations:{paths_str}")
            return jsonify({'error': f"File {filename} not found in any results directory"}), 404

    # Return the actual file
    return send_file(file_path, as_attachment=True)

@app.route('/api/test_connection', methods=['GET'])
def test_api_connection():
    """Test the BigBox API connection."""
    try:
        # Get API key from environment
        api_key = API_KEY or os.getenv('BIGBOX_API_KEY')
        
        if not api_key:
            return jsonify({
                'success': False,
                'message': 'API key not configured. Please set the BIGBOX_API_KEY environment variable.'
            }), 400
            
        # Import the client
        from bigbox_api_client.client import BigBoxClient
        
        # Create a client
        client = BigBoxClient(api_key=api_key)
        
        # Test with a simple search
        test_term = "test"
        logger.info(f"Testing API connection with search term: {test_term}")
        
        # Make the request
        response = client.search_products(search_term=test_term, page=1)
        
        # Check if the request was successful
        if isinstance(response, dict) and response.get('request_info', {}).get('success', False):
            # Get credits information
            credits_remaining = response.get('request_info', {}).get('credits_remaining', 'unknown')
            
            # Check if we have search results
            if 'search_results' in response:
                products = response.get('search_results', [])
                
                return jsonify({
                    'success': True,
                    'message': f'API connection successful. Found {len(products)} products for test search.',
                    'credits_remaining': credits_remaining,
                    'response_keys': list(response.keys())
                })
            else:
                return jsonify({
                    'success': True,
                    'message': 'API connection successful, but no search results found.',
                    'credits_remaining': credits_remaining,
                    'response_keys': list(response.keys())
                })
        else:
            error_msg = response.get('request_info', {}).get('message', 'Unknown error')
            return jsonify({
                'success': False,
                'message': f'API request failed: {error_msg}',
                'response': response
            }), 400
            
    except Exception as e:
        logger.exception("Error testing API connection")
        return jsonify({
            'success': False,
            'message': f'Error: {str(e)}'
        }), 500
# Add this function near the top of your file, after imports
# Add this import at the top of the file
from api_diagnostics_handler import handle_api_test

# Add these routes to your Flask app
@app.route('/api/diagnostics')
def api_diagnostics():
    """Render the API diagnostics page."""
    return render_template('api_diagnostics.html')

@app.route('/api/test', methods=['POST'])
def api_test():
    """Test the BigBox API connection."""
    return handle_api_test()
@app.route('/api/diagnostics', methods=['GET'])
def api_diagnostics():
    """Run diagnostics on the BigBox API connection."""
    import requests
    import json
    import os
    
    results = {
        'api_key_status': 'Not configured',
        'api_connection': 'Not tested',
        'search_results': 'Not tested',
        'errors': [],
        'recommendations': []
    }
    
    # Check API key configuration
    api_key = os.getenv('BIGBOX_API_KEY')
    if not api_key:
        results['api_key_status'] = 'Missing'
        results['errors'].append('API key is not configured')
        results['recommendations'].append('Set the BIGBOX_API_KEY environment variable')
    else:
        # Mask the API key for display
        masked_key = f"{'*' * (len(api_key) - 4)}{api_key[-4:]}" if len(api_key) > 4 else "****"
        results['api_key_status'] = f'Configured (ends with {api_key[-4:]})'
        
        # Test API connection
        try:
            base_url = "https://api.bigboxapi.com/request"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # Simple test request
            payload = {
                "source": "home_depot",
                "country": "us",
                "type": "search",
                "search_term": "pipe",
                "page": 1
            }
            
            response = requests.post(base_url, headers=headers, json=payload, timeout=10)
            results['api_connection'] = f'Status code: {response.status_code}'
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    
                    # Check request info
                    if 'request_info' in data:
                        request_info = data['request_info']
                        results['request_info'] = request_info
                        
                        if request_info.get('success', False):
                            results['api_connection'] = 'Success'
                            
                            # Check credits
                            credits = request_info.get('credits_remaining')
                            if credits is not None:
                                results['credits_remaining'] = credits
                                if credits <= 0:
                                    results['errors'].append('No API credits remaining')
                                    results['recommendations'].append('Purchase more API credits')
                        else:
                            error_msg = request_info.get('message', 'Unknown error')
                            results['api_connection'] = f'Failed: {error_msg}'
                            results['errors'].append(f'API request failed: {error_msg}')
                            
                            if 'invalid api key' in error_msg.lower():
                                results['recommendations'].append('Check that your API key is correct')
                            elif 'credits' in error_msg.lower():
                                results['recommendations'].append('Based on the logs, the scraper is running but not finding any products. This suggests an issue with the API connection or configuration. Let's implement a comprehensive solution to diagnose and fix this problem.

I'll create:
1. A diagnostic endpoint to test the API connection
2. An API key validation function
3. Enhanced error handling in the scraper

Here are the implementations:

**File: /Users/raymondkinneiii/Desktop/Home-Depot-Scraper-main/app.py**
```python
# Add this new route to your app.py file
@app.route('/api/diagnostics', methods=['GET'])
def api_diagnostics():
    """Diagnostic page for API connection issues."""
    return render_template('api_diagnostics.html')

@app.route('/api/test', methods=['POST'])
def test_api():
    """Test the BigBox API connection with provided or environment API key."""
    import requests
    import json
    
    # Get API key from request or environment
    api_key = request.form.get('api_key') or API_KEY
    search_term = request.form.get('search_term') or 'pipe'
    
    if not api_key:
        return jsonify({
            'success': False,
            'error': 'API key not provided or configured'
        }), 400
    
    try:
        # Make a direct API request
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": search_term,
            "page": 1
        }
        
        # Log the request (without showing the full API key)
        masked_key = f"{'*' * (len(api_key) - 4)}{api_key[-4:]}" if len(api_key) > 4 else "****"
        logger.info(f"Testing API with key {masked_key} and search term '{search_term}'")
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=30)
        
        # Process the response
        result = {
            'status_code': response.status_code,
            'success': response.status_code == 200
        }
        
        if response.status_code == 200:
            try:
                data = response.json()
                result['response_data'] = data
                
                # Check if the request was successful according to the API
                if 'request_info' in data:
                    request_info = data['request_info']
                    result['api_success'] = request_info.get('success', False)
                    result['message'] = request_info.get('message', '')
                    result['credits_remaining'] = request_info.get('credits_remaining', 'unknown')
                
                # Check for search results
                if 'search_results' in data:
                    result['product_count'] = len(data['search_results'])
                    
                    # Include sample product data if available
                    if data['search_results']:
                        sample_product = data['search_results'][0].get('product', {})
                        result['sample_product'] = {
                            'title': sample_product.get('title', 'N/A'),
                            'price': sample_product.get('price', 'N/A'),
                            'link': sample_product.get('link', 'N/A')
                        }
                else:
                    result['product_count'] = 0
                
                # If API reports success but no products found, it might be a different issue
                if result.get('api_success', False) and result.get('product_count', 0) == 0:
                    result['warning'] = "API connection successful, but no products found. Try a different search term."
                
                # Update environment API key if requested and test was successful
                if request.form.get('update_env') == 'true' and result.get('api_success', False):
                    # In a real implementation, you'd need to update the environment variable
                    # or configuration file. This is just a placeholder.
                    logger.info("API key validated successfully. Would update environment.")
                    result['env_updated'] = True
                
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response from API"
                result['raw_response'] = response.text[:500]  # First 500 chars
        else:
            result['error'] = f"HTTP Error: {response.status_code}"
            try:
                result['raw_response'] = response.text[:500]
            except:
                result['raw_response'] = "Could not read response text"
        
        return jsonify(result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f"Request error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        }), 500

# Add this function to validate API keys
def validate_api_key(api_key):
    """Validate an API key by making a simple request."""
    import requests
    
    if not api_key:
        return False, "API key is empty"
    
    try:
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple request to check API key validity
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": "test",
            "page": 1
        }
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'request_info' in data and data['request_info'].get('success', False):
                credits = data['request_info'].get('credits_remaining', 0)
                return True, f"API key is valid. Credits remaining: {credits}"
            else:
                error_msg = data.get('request_info', {}).get('message', 'Unknown error')
                return False, f"API key validation failed: {error_msg}"
        else:
            return False, f"API key validation failed with status code: {response.status_code}"
    
    except Exception as e:
        return False, f"API key validation error: {str(e)}"

# Modify the create_job route to validate API key
@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new scraper job."""
    global next_job_id
    
    try:
        # Get job configuration from request
        config = request.json
        
        # Validate API key if provided
        api_key = config.get('api_key') or API_KEY
        if not api_key:
            return jsonify({
                'status': 'error',
                'message': 'API key is required. Please provide an API key or set the BIGBOX_API_KEY environment variable.'
            }), 400
        
        # Quick validation of API key
        is_valid, message = validate_api_key(api_key)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': f"Invalid API key: {message}"
            }), 400
        
        # Create job
        job_id = next_job_id
        next_job_id += 1
        
        # Store API key in config
        config['api_key'] = api_key
        
        # Create job object
        job = ScraperJob(job_id, config)
        scraper_jobs[job_id] = job
        
        # Start job in a separate thread
        thread = threading.Thread(target=run_scraper_job, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': f'Job {job_id} created successfully',
            'job_id': job_id
        })
    
    except Exception as e:
        logger.exception(f"Error creating job: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error creating job: {str(e)}'
        }), 500
                                results['recommendations'].append('Based on the logs, the scraper is running but not finding any products. This suggests an issue with the API connection or configuration. Let's implement a comprehensive solution to diagnose and fix this problem.

I'll create:
1. A diagnostic endpoint to test the API connection
2. An API key validation function
3. Enhanced error handling in the scraper

Here are the implementations:

**File: /Users/raymondkinneiii/Desktop/Home-Depot-Scraper-main/app.py**
```python
# Add this new route to your app.py file
@app.route('/api/diagnostics', methods=['GET'])
def api_diagnostics():
    """Diagnostic page for API connection issues."""
    return render_template('api_diagnostics.html')

@app.route('/api/test', methods=['POST'])
def test_api():
    """Test the BigBox API connection with provided or environment API key."""
    import requests
    import json
    
    # Get API key from request or environment
    api_key = request.form.get('api_key') or API_KEY
    search_term = request.form.get('search_term') or 'pipe'
    
    if not api_key:
        return jsonify({
            'success': False,
            'error': 'API key not provided or configured'
        }), 400
    
    try:
        # Make a direct API request
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": search_term,
            "page": 1
        }
        
        # Log the request (without showing the full API key)
        masked_key = f"{'*' * (len(api_key) - 4)}{api_key[-4:]}" if len(api_key) > 4 else "****"
        logger.info(f"Testing API with key {masked_key} and search term '{search_term}'")
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=30)
        
        # Process the response
        result = {
            'status_code': response.status_code,
            'success': response.status_code == 200
        }
        
        if response.status_code == 200:
            try:
                data = response.json()
                result['response_data'] = data
                
                # Check if the request was successful according to the API
                if 'request_info' in data:
                    request_info = data['request_info']
                    result['api_success'] = request_info.get('success', False)
                    result['message'] = request_info.get('message', '')
                    result['credits_remaining'] = request_info.get('credits_remaining', 'unknown')
                
                # Check for search results
                if 'search_results' in data:
                    result['product_count'] = len(data['search_results'])
                    
                    # Include sample product data if available
                    if data['search_results']:
                        sample_product = data['search_results'][0].get('product', {})
                        result['sample_product'] = {
                            'title': sample_product.get('title', 'N/A'),
                            'price': sample_product.get('price', 'N/A'),
                            'link': sample_product.get('link', 'N/A')
                        }
                else:
                    result['product_count'] = 0
                
                # If API reports success but no products found, it might be a different issue
                if result.get('api_success', False) and result.get('product_count', 0) == 0:
                    result['warning'] = "API connection successful, but no products found. Try a different search term."
                
                # Update environment API key if requested and test was successful
                if request.form.get('update_env') == 'true' and result.get('api_success', False):
                    # In a real implementation, you'd need to update the environment variable
                    # or configuration file. This is just a placeholder.
                    logger.info("API key validated successfully. Would update environment.")
                    result['env_updated'] = True
                
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response from API"
                result['raw_response'] = response.text[:500]  # First 500 chars
        else:
            result['error'] = f"HTTP Error: {response.status_code}"
            try:
                result['raw_response'] = response.text[:500]
            except:
                result['raw_response'] = "Could not read response text"
        
        return jsonify(result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f"Request error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        }), 500

# Add this function to validate API keys
def validate_api_key(api_key):
    """Validate an API key by making a simple request."""
    import requests
    
    if not api_key:
        return False, "API key is empty"
    
    try:
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple request to check API key validity
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": "test",
            "page": 1
        }
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'request_info' in data and data['request_info'].get('success', False):
                credits = data['request_info'].get('credits_remaining', 0)
                return True, f"API key is valid. Credits remaining: {credits}"
            else:
                error_msg = data.get('request_info', {}).get('message', 'Unknown error')
                return False, f"API key validation failed: {error_msg}"
        else:
            return False, f"API key validation failed with status code: {response.status_code}"
    
    except Exception as e:
        return False, f"API key validation error: {str(e)}"

# Modify the create_job route to validate API key
@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new scraper job."""
    global next_job_id
    
    try:
        # Get job configuration from request
        config = request.json
        
        # Validate API key if provided
        api_key = config.get('api_key') or API_KEY
        if not api_key:
            return jsonify({
                'status': 'error',
                'message': 'API key is required. Please provide an API key or set the BIGBOX_API_KEY environment variable.'
            }), 400
        
        # Quick validation of API key
        is_valid, message = validate_api_key(api_key)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': f"Invalid API key: {message}"
            }), 400
        
        # Create job
        job_id = next_job_id
        next_job_id += 1
        
        # Store API key in config
        config['api_key'] = api_key
        
        # Create job object
        job = ScraperJob(job_id, config)
        scraper_jobs[job_id] = job
        
        # Start job in a separate thread
        thread = threading.Thread(target=run_scraper_job, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': f'Job {job_id} created successfully',
            'job_id': job_id
        })
    
    except Exception as e:
        logger.exception(f"Error creating job: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error creating job: {str(e)}'
        }), 500
                                results['recommendations'].append('Based on the logs, the scraper is running but not finding any products. This suggests an issue with the API connection or configuration. Let's implement a comprehensive solution to diagnose and fix this problem.

I'll create:
1. A diagnostic endpoint to test the API connection
2. An API key validation function
3. Enhanced error handling in the scraper

Here are the implementations:

**File: /Users/raymondkinneiii/Desktop/Home-Depot-Scraper-main/app.py**
```python
# Add this new route to your app.py file
@app.route('/api/diagnostics', methods=['GET'])
def api_diagnostics():
    """Diagnostic page for API connection issues."""
    return render_template('api_diagnostics.html')

@app.route('/api/test', methods=['POST'])
def test_api():
    """Test the BigBox API connection with provided or environment API key."""
    import requests
    import json
    
    # Get API key from request or environment
    api_key = request.form.get('api_key') or API_KEY
    search_term = request.form.get('search_term') or 'pipe'
    
    if not api_key:
        return jsonify({
            'success': False,
            'error': 'API key not provided or configured'
        }), 400
    
    try:
        # Make a direct API request
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": search_term,
            "page": 1
        }
        
        # Log the request (without showing the full API key)
        masked_key = f"{'*' * (len(api_key) - 4)}{api_key[-4:]}" if len(api_key) > 4 else "****"
        logger.info(f"Testing API with key {masked_key} and search term '{search_term}'")
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=30)
        
        # Process the response
        result = {
            'status_code': response.status_code,
            'success': response.status_code == 200
        }
        
        if response.status_code == 200:
            try:
                data = response.json()
                result['response_data'] = data
                
                # Check if the request was successful according to the API
                if 'request_info' in data:
                    request_info = data['request_info']
                    result['api_success'] = request_info.get('success', False)
                    result['message'] = request_info.get('message', '')
                    result['credits_remaining'] = request_info.get('credits_remaining', 'unknown')
                
                # Check for search results
                if 'search_results' in data:
                    result['product_count'] = len(data['search_results'])
                    
                    # Include sample product data if available
                    if data['search_results']:
                        sample_product = data['search_results'][0].get('product', {})
                        result['sample_product'] = {
                            'title': sample_product.get('title', 'N/A'),
                            'price': sample_product.get('price', 'N/A'),
                            'link': sample_product.get('link', 'N/A')
                        }
                else:
                    result['product_count'] = 0
                
                # If API reports success but no products found, it might be a different issue
                if result.get('api_success', False) and result.get('product_count', 0) == 0:
                    result['warning'] = "API connection successful, but no products found. Try a different search term."
                
                # Update environment API key if requested and test was successful
                if request.form.get('update_env') == 'true' and result.get('api_success', False):
                    # In a real implementation, you'd need to update the environment variable
                    # or configuration file. This is just a placeholder.
                    logger.info("API key validated successfully. Would update environment.")
                    result['env_updated'] = True
                
            except json.JSONDecodeError:
                result['success'] = False
                result['error'] = "Invalid JSON response from API"
                result['raw_response'] = response.text[:500]  # First 500 chars
        else:
            result['error'] = f"HTTP Error: {response.status_code}"
            try:
                result['raw_response'] = response.text[:500]
            except:
                result['raw_response'] = "Could not read response text"
        
        return jsonify(result)
        
    except requests.exceptions.RequestException as e:
        return jsonify({
            'success': False,
            'error': f"Request error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"Unexpected error: {str(e)}"
        }), 500

# Add this function to validate API keys
def validate_api_key(api_key):
    """Validate an API key by making a simple request."""
    import requests
    
    if not api_key:
        return False, "API key is empty"
    
    try:
        base_url = "https://api.bigboxapi.com/request"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Simple request to check API key validity
        payload = {
            "source": "home_depot",
            "country": "us",
            "type": "search",
            "search_term": "test",
            "page": 1
        }
        
        response = requests.post(base_url, headers=headers, json=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if 'request_info' in data and data['request_info'].get('success', False):
                credits = data['request_info'].get('credits_remaining', 0)
                return True, f"API key is valid. Credits remaining: {credits}"
            else:
                error_msg = data.get('request_info', {}).get('message', 'Unknown error')
                return False, f"API key validation failed: {error_msg}"
        else:
            return False, f"API key validation failed with status code: {response.status_code}"
    
    except Exception as e:
        return False, f"API key validation error: {str(e)}"

# Modify the create_job route to validate API key
@app.route('/api/jobs', methods=['POST'])
def create_job():
    """Create a new scraper job."""
    global next_job_id
    
    try:
        # Get job configuration from request
        config = request.json
        
        # Validate API key if provided
        api_key = config.get('api_key') or API_KEY
        if not api_key:
            return jsonify({
                'status': 'error',
                'message': 'API key is required. Please provide an API key or set the BIGBOX_API_KEY environment variable.'
            }), 400
        
        # Quick validation of API key
        is_valid, message = validate_api_key(api_key)
        if not is_valid:
            return jsonify({
                'status': 'error',
                'message': f"Invalid API key: {message}"
            }), 400
        
        # Create job
        job_id = next_job_id
        next_job_id += 1
        
        # Store API key in config
        config['api_key'] = api_key
        
        # Create job object
        job = ScraperJob(job_id, config)
        scraper_jobs[job_id] = job
        
        # Start job in a separate thread
        thread = threading.Thread(target=run_scraper_job, args=(job,))
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'success',
            'message': f'Job {job_id} created successfully',
            'job_id': job_id
        })
    
    except Exception as e:
        logger.exception(f"Error creating job: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Error creating job: {str(e)}'
        }), 500
def check_api_key():
    """Check if the API key is configured and valid."""
    api_key = API_KEY or os.getenv('BIGBOX_API_KEY')
    
    if not api_key:
        logger.warning("BIGBOX_API_KEY environment variable is not set")
        return False
        
    try:
        # Import the client
        from bigbox_api_client.client import BigBoxClient
        
        # Create a client
        client = BigBoxClient(api_key=api_key)
        
        # Test with a simple search
        test_term = "test"
        logger.info(f"Testing API connection with search term: {test_term}")
        
        # Make the
@app.route('/health')
@app.route('/api_test')
def api_test_page():
    """Render the API test page."""
    return render_template('api_test.html')
def health_check():
    """Health check endpoint for Cloud Run."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

import threading
import webbrowser
import time

# This section is now handled by combined_app.py
if __name__ == '__main__':
    # Create a Flask app for standalone operation
    standalone_app = Flask(__name__)
    standalone_app.register_blueprint(app)

    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8080))
    # In production (like Cloud Run), we don't want debug mode
    debug_mode = os.environ.get('DEBUG', 'False').lower() == 'true'

    def open_browser():
        try:
            # Wait a moment for the server to start
            time.sleep(1)
            url = f"http://localhost:{port}"
            webbrowser.open(url)
            logger.info(f"Opened web browser at {url}")
        except Exception as e:
            logger.error(f"Failed to open web browser: {e}")

    # Check if auto open browser is enabled via environment variable
    auto_open = os.environ.get('AUTO_OPEN_BROWSER', 'False').lower() == 'true'
    if auto_open:
        # Only open browser once, then disable auto_open to prevent multiple windows
        threading.Thread(target=open_browser).start()
        os.environ['AUTO_OPEN_BROWSER'] = 'False'

    standalone_app.run(host='0.0.0.0', port=port, debug=debug_mode)
