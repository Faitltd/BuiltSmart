# This file would contain the backend code for the Lowes scraper
# I need to check if it expects an output_format parameter
#!/usr/bin/env python3
"""
Lowe's Scraper Web Application

This Flask application provides a web interface for the Lowe's scraper,
allowing users to configure and run scraping jobs with different search types
and customize CSV header names.
"""

import os
import json
import time
import threading
import logging
import csv
import platform
import pickle
from datetime import datetime
from flask import Flask, Blueprint, render_template, request, jsonify, send_file, redirect, url_for
from dotenv import load_dotenv
from homedepot_scraper.log_handler import JobLogHandler

# Load environment variables from .env file
load_dotenv()

# Access the API key
LOWES_API_KEY = os.getenv('LOWES_API_KEY', 'D302834B9CC3400FA921A2F2D384ADD6')

# Import scraper components
from lowes_scraper.scraper import LowesScraper
from config.lowes_settings import API_KEY, RAW_DATA_DIR, RESULTS_DIR, CSV_TEMPLATE, LOWES_CATEGORIES, PRODUCT_LIMIT_OPTIONS, STANDARD_CSV_HEADERS, DEFAULT_CSV_HEADERS

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
app = Blueprint('lowes_app', __name__, template_folder='templates', static_folder='static')

# Load jobs data when the app starts
@app.before_app_first_request
def initialize_app():
    """Initialize the app by loading jobs data."""
    load_jobs_data()
    logger.info(f"Loaded {len(scraper_jobs)} jobs from disk")

# Global variables
scraper_jobs = {}
next_job_id = 1

# Ensure directories exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs('static', exist_ok=True)
os.makedirs('templates', exist_ok=True)
os.makedirs('data/lowes/desktop', exist_ok=True)  # Create cloud-friendly Desktop directory
os.makedirs('data/lowes/jobs', exist_ok=True)  # Directory to store job data

# Path to the jobs data file
JOBS_DATA_FILE = 'data/lowes/jobs/jobs_data.json'

# Functions to save and load job data
def save_jobs_data():
    """Save jobs data to file."""
    try:
        # Convert jobs to dictionaries
        jobs_data = {job_id: job.to_dict() for job_id, job in scraper_jobs.items()}

        # Save to file
        with open(JOBS_DATA_FILE, 'w') as f:
            json.dump(jobs_data, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving jobs data: {str(e)}")

def load_jobs_data():
    """Load jobs data from file."""
    global scraper_jobs, next_job_id

    try:
        if os.path.exists(JOBS_DATA_FILE):
            with open(JOBS_DATA_FILE, 'r') as f:
                jobs_data = json.load(f)

            # Convert dictionaries to jobs
            for job_id_str, job_data in jobs_data.items():
                job_id = int(job_id_str)
                scraper_jobs[job_id] = ScraperJob.from_dict(job_data)

                # Update next_job_id
                if job_id >= next_job_id:
                    next_job_id = job_id + 1
    except Exception as e:
        logger.error(f"Error loading jobs data: {str(e)}")

# Function to detect if we're running in a cloud environment
def is_cloud_environment():
    """Detect if we're running in a cloud environment."""
    # Always assume we're in a cloud environment for safety
    # This ensures Desktop paths are always handled safely
    return True

# Job class to track scraper jobs
class ScraperJob:
    """Class to track scraper jobs."""

    def __init__(self, job_id, search_type, max_pages, max_products, output_format, csv_headers=None):
        """Initialize a scraper job."""
        self.job_id = job_id
        self.search_type = search_type
        self.max_pages = max_pages
        self.max_products = max_products
        self.output_format = output_format
        self.csv_headers = csv_headers or STANDARD_CSV_HEADERS
        self.status = "PENDING"
        self.start_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.end_time = None
        self.products_collected = 0
        self.total_products = 0
        self.progress = 0
        self.status_message = "Initializing..."
        self.output_file = None
        self.log_messages = []
        self.thread = None
        self.stop_requested = False

    def to_dict(self):
        """Convert job to dictionary for JSON serialization."""
        return {
            "job_id": self.job_id,
            "search_type": self.search_type,
            "max_pages": self.max_pages,
            "max_products": self.max_products,
            "output_format": self.output_format,
            "csv_headers": self.csv_headers,
            "status": self.status,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "products_collected": self.products_collected,
            "total_products": self.total_products,
            "progress": self.progress,
            "status_message": self.status_message,
            "output_file": self.output_file,
            "log_messages": self.log_messages,
            "stop_requested": self.stop_requested
        }

    @classmethod
    def from_dict(cls, data):
        """Create a job from a dictionary."""
        job = cls(
            job_id=data["job_id"],
            search_type=data["search_type"],
            max_pages=data["max_pages"],
            max_products=data["max_products"],
            output_format=data["output_format"],
            csv_headers=data.get("csv_headers", STANDARD_CSV_HEADERS)
        )
        job.status = data["status"]
        job.start_time = data["start_time"]
        job.end_time = data["end_time"]
        job.products_collected = data["products_collected"]
        job.total_products = data["total_products"]
        job.progress = data["progress"]
        job.status_message = data["status_message"]
        job.output_file = data["output_file"]
        job.log_messages = data["log_messages"]
        job.stop_requested = data.get("stop_requested", False)
        return job

    def log(self, message):
        """Add a log message."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        logger.info(log_message)
        self.log_messages.append(log_message)

        # Limit log messages to the last 1000
        if len(self.log_messages) > 1000:
            self.log_messages = self.log_messages[-1000:]

        # Save job data after each log message
        save_jobs_data()

    def update_progress(self, current, total, message=None):
        """Update job progress."""
        self.products_collected = current
        self.total_products = total
        if total > 0:
            self.progress = min(int((current / total) * 100), 100)
        else:
            self.progress = 0

        if message:
            self.status_message = message
            self.log(message)

        # Save job data after progress update
        save_jobs_data()

# Search types
SEARCH_TYPES = {
    "category": "Category",
    "search_term": "Search Term",
    "url_list": "URL List"
}

# Routes
@app.route('/')
def lowes_home():
    """Redirect to combined page."""
    return redirect(url_for('lowes_app.lowes_combined_page'))

@app.route('/combined')
def lowes_combined_page():
    """Combined new job form and jobs list page."""
    return render_template('combined_lowes.html',
                          search_types=SEARCH_TYPES,
                          categories=LOWES_CATEGORIES,
                          default_api_key="",  # Don't pass API key to template
                          default_csv_headers=DEFAULT_CSV_HEADERS,
                          standard_csv_headers=STANDARD_CSV_HEADERS,
                          jobs=[job.to_dict() for job in scraper_jobs.values()])

@app.route('/new')
def lowes_new_job():
    """New job form page (legacy route)."""
    return redirect(url_for('lowes_app.lowes_combined_page'))

@app.route('/jobs')
def lowes_list_jobs():
    """List all jobs (legacy route)."""
    return redirect(url_for('lowes_app.lowes_combined_page'))

@app.route('/job/<int:job_id>')
def lowes_job_details(job_id):
    """Show job details."""
    job = scraper_jobs.get(job_id)
    if not job:
        # Create a template for error.html if it doesn't exist
        if not os.path.exists('templates/error.html'):
            with open('templates/error.html', 'w') as f:
                f.write("""
                {% extends "lowes_base.html" %}
                {% block title %}Error{% endblock %}
                {% block content %}
                <div class="container mt-5">
                    <div class="alert alert-danger">
                        <h4>Error</h4>
                        <p>{{ message }}</p>
                    </div>
                    <a href="/jobs" class="btn btn-primary">Back to Jobs</a>
                </div>
                {% endblock %}
                """)
        return render_template('error.html', message=f"Job {job_id} not found"), 404

    return render_template('lowes_job_details.html', job=job.to_dict(), log_messages=job.log_messages)

# API routes
@app.route('/api/start_job', methods=['POST'])
def lowes_start_job():
    """Start a new scraper job."""
    global next_job_id

    try:
        data = request.json

        # Validate required fields
        if not data or 'search_type' not in data:
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        # Get job parameters
        search_type = data.get('search_type')
        max_pages = int(data.get('max_pages', 5))
        max_products = int(data.get('max_products', 0))
        output_format = data.get('output_format', 'csv')
        csv_headers = data.get('csv_headers', STANDARD_CSV_HEADERS)

        # Create job
        job_id = next_job_id
        next_job_id += 1

        job = ScraperJob(
            job_id=job_id,
            search_type=search_type,
            max_pages=max_pages,
            max_products=max_products,
            output_format=output_format,
            csv_headers=csv_headers
        )

        # Add job to global dict
        scraper_jobs[job_id] = job

        # Start job in a separate thread
        if search_type == 'category':
            category_id = data.get('category')
            if not category_id:
                return jsonify({"success": False, "error": "Missing category ID"}), 400

            job.log(f"Starting category scrape for category ID: {category_id}")
            job.thread = threading.Thread(
                target=run_category_scrape,
                args=(job, category_id, max_pages, max_products, output_format, csv_headers)
            )

        elif search_type == 'search_term':
            search_terms = data.get('search_terms', [])
            if not search_terms:
                return jsonify({"success": False, "error": "Missing search terms"}), 400

            job.log(f"Starting search term scrape for {len(search_terms)} terms")
            job.thread = threading.Thread(
                target=run_search_term_scrape,
                args=(job, search_terms, max_pages, max_products, output_format, csv_headers)
            )

        elif search_type == 'url_list':
            urls = data.get('urls', [])
            if not urls:
                return jsonify({"success": False, "error": "Missing URLs"}), 400

            job.log(f"Starting URL list scrape for {len(urls)} URLs")
            job.thread = threading.Thread(
                target=run_url_list_scrape,
                args=(job, urls, max_products, output_format, csv_headers)
            )

        else:
            return jsonify({"success": False, "error": f"Invalid search type: {search_type}"}), 400

        # Start the thread
        job.status = "RUNNING"
        job.thread.daemon = True
        job.thread.start()

        # Save job data
        save_jobs_data()

        return jsonify({"success": True, "job_id": job_id})

    except Exception as e:
        logger.exception(f"Error starting job: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/job/<int:job_id>')
def lowes_get_job(job_id):
    """Get job status."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": f"Job {job_id} not found"}), 404

    return jsonify(job.to_dict())

@app.route('/api/stop_job/<int:job_id>', methods=['POST'])
def lowes_stop_job(job_id):
    """Stop a running job."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": f"Job {job_id} not found"}), 404

    if job.status != "RUNNING":
        return jsonify({"success": False, "error": f"Job {job_id} is not running"}), 400

    # Set stop flag
    job.stop_requested = True
    job.log("Stop requested by user")

    return jsonify({"success": True})

@app.route('/api/download/<int:job_id>')
def lowes_download_results(job_id):
    """Download job results."""
    job = scraper_jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "error": f"Job {job_id} not found"}), 404

    if not job.output_file or not os.path.exists(job.output_file):
        return jsonify({"success": False, "error": "No output file available"}), 404

    # Get filename from path
    filename = os.path.basename(job.output_file)

    return send_file(job.output_file, as_attachment=True, download_name=filename)

# Scraper functions
def run_category_scrape(job, category_id, max_pages, max_products, output_format, csv_headers):
    """Run a category scrape job."""
    try:
        # Check if API key is available
        if not LOWES_API_KEY:
            job.log("Error: No API key found. Please set the LOWES_API_KEY environment variable.")
            job.status = "failed"
            return

        job.log(f"Initializing Lowe's scraper with API key: {LOWES_API_KEY[:4]}...{LOWES_API_KEY[-4:]}")
        scraper = LowesScraper(api_key=LOWES_API_KEY, output_dir="data/lowes")

        # Set up custom log handler to capture scraper logs
        scraper_logger = logging.getLogger('lowes_scraper.scraper')
        job_log_handler = JobLogHandler(job)
        job_log_handler.setLevel(logging.INFO)
        scraper_logger.addHandler(job_log_handler)

        # Also capture logs from the API module
        api_logger = logging.getLogger('lowes_scraper.api')
        api_logger.addHandler(job_log_handler)

        job.log(f"Starting category scrape for category ID: {category_id}")
        job.update_progress(0, max_products or 100, f"Scraping category {category_id}...")

        # Scrape category
        product_urls = scraper.scrape_category(
            category_id=category_id,
            max_pages=max_pages,
            max_products=max_products
        )

        job.log(f"Found {len(product_urls)} product URLs")
        job.update_progress(0, len(product_urls), f"Found {len(product_urls)} products. Fetching details...")

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
            return

        # Fetch product details
        def progress_callback(current, total, message):
            job.update_progress(current, total, message)
            # Check if stop requested
            return job.stop_requested

        scraper.fetch_product_details(callback=progress_callback)

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
        else:
            job.status = "COMPLETED"
            job.log("Job completed successfully")

        # Save results
        if output_format == 'template':
            job.output_file = scraper.save_results_template()
        else:
            job.output_file = scraper.save_results(format=output_format, custom_headers=csv_headers)

        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        job.log(f"Results saved to {job.output_file}")
        job.update_progress(job.products_collected, job.total_products, f"Job {job.status.lower()}")

    except Exception as e:
        job.status = "FAILED"
        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_message = f"Error in category scrape: {str(e)}"
        job.log(error_message)
        job.update_progress(job.products_collected, job.total_products, error_message)
        logger.exception(error_message)

def run_search_term_scrape(job, search_terms, max_pages, max_products, output_format, csv_headers):
    """Run a search term scrape job."""
    try:
        # Check if API key is available
        if not LOWES_API_KEY:
            job.log("Error: No API key found. Please set the LOWES_API_KEY environment variable.")
            job.status = "failed"
            return

        job.log(f"Initializing Lowe's scraper with API key: {LOWES_API_KEY[:4]}...{LOWES_API_KEY[-4:]}")
        scraper = LowesScraper(api_key=LOWES_API_KEY, output_dir="data/lowes")

        # Set up custom log handler to capture scraper logs
        scraper_logger = logging.getLogger('lowes_scraper.scraper')
        job_log_handler = JobLogHandler(job)
        job_log_handler.setLevel(logging.INFO)
        scraper_logger.addHandler(job_log_handler)

        # Also capture logs from the API module
        api_logger = logging.getLogger('lowes_scraper.api')
        api_logger.addHandler(job_log_handler)

        job.log(f"Starting search term scrape for {len(search_terms)} terms")
        job.update_progress(0, len(search_terms), f"Scraping {len(search_terms)} search terms...")

        # Scrape each search term
        for i, term in enumerate(search_terms):
            if job.stop_requested:
                break

            job.log(f"Scraping search term {i+1}/{len(search_terms)}: {term}")
            job.update_progress(i, len(search_terms), f"Scraping term {i+1}/{len(search_terms)}: {term}")

            # Scrape search term
            scraper.scrape_search_term(
                search_term=term,
                max_pages=max_pages,
                max_products=max_products
            )

        product_urls = list(scraper.product_urls)
        job.log(f"Found {len(product_urls)} product URLs")
        job.update_progress(0, len(product_urls), f"Found {len(product_urls)} products. Fetching details...")

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
            return

        # Fetch product details
        def progress_callback(current, total, message):
            job.update_progress(current, total, message)
            # Check if stop requested
            return job.stop_requested

        scraper.fetch_product_details(callback=progress_callback)

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
        else:
            job.status = "COMPLETED"
            job.log("Job completed successfully")

        # Save results
        if output_format == 'template':
            job.output_file = scraper.save_results_template()
        else:
            job.output_file = scraper.save_results(format=output_format, custom_headers=csv_headers)

        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        job.log(f"Results saved to {job.output_file}")
        job.update_progress(job.products_collected, job.total_products, f"Job {job.status.lower()}")

    except Exception as e:
        job.status = "FAILED"
        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_message = f"Error in search term scrape: {str(e)}"
        job.log(error_message)
        job.update_progress(job.products_collected, job.total_products, error_message)
        logger.exception(error_message)

def run_url_list_scrape(job, urls, max_products, output_format, csv_headers):
    """Run a URL list scrape job."""
    try:
        # Check if API key is available
        if not LOWES_API_KEY:
            job.log("Error: No API key found. Please set the LOWES_API_KEY environment variable.")
            job.status = "failed"
            return

        job.log(f"Initializing Lowe's scraper with API key: {LOWES_API_KEY[:4]}...{LOWES_API_KEY[-4:]}")
        scraper = LowesScraper(api_key=LOWES_API_KEY, output_dir="data/lowes")

        # Set up custom log handler to capture scraper logs
        scraper_logger = logging.getLogger('lowes_scraper.scraper')
        job_log_handler = JobLogHandler(job)
        job_log_handler.setLevel(logging.INFO)
        scraper_logger.addHandler(job_log_handler)

        # Also capture logs from the API module
        api_logger = logging.getLogger('lowes_scraper.api')
        api_logger.addHandler(job_log_handler)

        job.log(f"Starting URL list scrape for {len(urls)} URLs")
        job.update_progress(0, len(urls), f"Processing {len(urls)} URLs...")

        # Add URLs to scraper
        scraper.scrape_specific_urls(urls, max_products=max_products)

        product_urls = list(scraper.product_urls)
        job.log(f"Processing {len(product_urls)} product URLs")
        job.update_progress(0, len(product_urls), f"Fetching details for {len(product_urls)} products...")

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
            return

        # Fetch product details
        def progress_callback(current, total, message):
            job.update_progress(current, total, message)
            # Check if stop requested
            return job.stop_requested

        scraper.fetch_product_details(callback=progress_callback)

        # Check if stop requested
        if job.stop_requested:
            job.status = "STOPPED"
            job.log("Job stopped by user")
        else:
            job.status = "COMPLETED"
            job.log("Job completed successfully")

        # Save results
        if output_format == 'template':
            job.output_file = scraper.save_results_template()
        else:
            job.output_file = scraper.save_results(format=output_format, custom_headers=csv_headers)

        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        job.log(f"Results saved to {job.output_file}")
        job.update_progress(job.products_collected, job.total_products, f"Job {job.status.lower()}")

    except Exception as e:
        job.status = "FAILED"
        job.end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        error_message = f"Error in URL list scrape: {str(e)}"
        job.log(error_message)
        job.update_progress(job.products_collected, job.total_products, error_message)
        logger.exception(error_message)

# This section is now handled by combined_app.py
if __name__ == '__main__':
    # Create a Flask app for standalone operation
    standalone_app = Flask(__name__)
    standalone_app.register_blueprint(app)

    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8081))
    standalone_app.run(host='0.0.0.0', port=port, debug=True)
