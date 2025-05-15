"""
API Server for Home Depot Scraper

This module provides a simple Flask API for triggering the scraper and retrieving results.
"""

import os
import json
import logging
import threading
from datetime import datetime
from flask import Flask, request, jsonify, send_file

from .cloud import run_scraper
from .creator import ScraperJobCreator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(f"homedepot_scraper_api_{datetime.now().strftime('%Y-%m-%d')}.log")
    ]
)

logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Global variables
scraper_running = False
last_run_status = None
last_run_time = None

# Initialize the Creator service
jobs_dir = os.environ.get('JOBS_DIR', 'jobs')
creator_service = ScraperJobCreator(jobs_dir=jobs_dir)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/status', methods=['GET'])
def status():
    """Get the status of the scraper."""
    return jsonify({
        'running': scraper_running,
        'last_run_status': last_run_status,
        'last_run_time': last_run_time.isoformat() if last_run_time else None
    })

@app.route('/run', methods=['POST'])
def run():
    """Trigger the scraper to run."""
    global scraper_running, last_run_status, last_run_time

    if scraper_running:
        return jsonify({
            'status': 'error',
            'message': 'Scraper is already running'
        }), 409

    # Start the scraper in a separate thread
    def run_scraper_thread():
        global scraper_running, last_run_status, last_run_time

        try:
            scraper_running = True
            last_run_time = datetime.now()

            # Run the scraper
            exit_code = run_scraper()

            # Update status
            last_run_status = 'success' if exit_code == 0 else 'error'

        except Exception as e:
            logger.exception(f"Error running scraper: {str(e)}")
            last_run_status = 'error'

        finally:
            scraper_running = False

    # Start the thread
    thread = threading.Thread(target=run_scraper_thread)
    thread.daemon = True
    thread.start()

    return jsonify({
        'status': 'started',
        'message': 'Scraper started successfully'
    })

@app.route('/results', methods=['GET'])
def list_results():
    """List available result files."""
    output_dir = os.environ.get('OUTPUT_DIR', 'data')
    results_dir = os.path.join(output_dir, 'results')

    if not os.path.exists(results_dir):
        return jsonify({
            'status': 'error',
            'message': 'Results directory not found'
        }), 404

    # List files in the results directory
    files = []
    for filename in os.listdir(results_dir):
        filepath = os.path.join(results_dir, filename)
        if os.path.isfile(filepath):
            files.append({
                'name': filename,
                'size': os.path.getsize(filepath),
                'modified': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
            })

    return jsonify({
        'status': 'success',
        'files': files
    })

@app.route('/results/<filename>', methods=['GET'])
def download_result(filename):
    """Download a specific result file."""
    output_dir = os.environ.get('OUTPUT_DIR', 'data')
    results_dir = os.path.join(output_dir, 'results')
    filepath = os.path.join(results_dir, filename)

    if not os.path.exists(filepath) or not os.path.isfile(filepath):
        return jsonify({
            'status': 'error',
            'message': 'File not found'
        }), 404

    return send_file(filepath, as_attachment=True)

# Creator Microservice Endpoints

@app.route('/jobs', methods=['GET'])
def list_jobs():
    """List all scraper jobs."""
    jobs = creator_service.list_jobs()
    return jsonify({
        'status': 'success',
        'jobs': jobs
    })

@app.route('/jobs', methods=['POST'])
def create_job():
    """Create a new scraper job."""
    data = request.json

    # Validate required fields
    required_fields = ['name', 'link_name', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({
                'status': 'error',
                'message': f'Missing required field: {field}'
            }), 400

    # Create the job
    job = creator_service.create_job(
        name=data['name'],
        link_name=data['link_name'],
        description=data['description'],
        categories=data.get('categories'),
        max_pages=data.get('max_pages'),
        max_products=data.get('max_products')
    )

    return jsonify({
        'status': 'success',
        'job': job
    }), 201

@app.route('/jobs/<job_id>', methods=['GET'])
def get_job(job_id):
    """Get a specific job by ID."""
    job = creator_service.get_job(job_id)

    if not job:
        return jsonify({
            'status': 'error',
            'message': 'Job not found'
        }), 404

    return jsonify({
        'status': 'success',
        'job': job
    })

@app.route('/jobs/by-link/<link_name>', methods=['GET'])
def get_job_by_link(link_name):
    """Get a specific job by link name."""
    job = creator_service.get_job_by_link_name(link_name)

    if not job:
        return jsonify({
            'status': 'error',
            'message': 'Job not found'
        }), 404

    return jsonify({
        'status': 'success',
        'job': job
    })

@app.route('/jobs/<job_id>', methods=['DELETE'])
def delete_job(job_id):
    """Delete a job."""
    success = creator_service.delete_job(job_id)

    if not success:
        return jsonify({
            'status': 'error',
            'message': 'Failed to delete job'
        }), 404

    return jsonify({
        'status': 'success',
        'message': 'Job deleted successfully'
    })

@app.route('/jobs/<job_id>/run', methods=['POST'])
def run_job(job_id):
    """Run a specific job."""
    global scraper_running, last_run_status, last_run_time

    if scraper_running:
        return jsonify({
            'status': 'error',
            'message': 'Scraper is already running'
        }), 409

    # Get the job
    job = creator_service.get_job(job_id)
    if not job:
        return jsonify({
            'status': 'error',
            'message': 'Job not found'
        }), 404

    # Update job status
    creator_service.update_job_status(job_id, 'running')

    # Start the scraper in a separate thread
    def run_job_thread():
        global scraper_running, last_run_status, last_run_time

        try:
            scraper_running = True
            last_run_time = datetime.now()

            # Get job configuration
            categories = job.get('categories')
            max_pages = job.get('config', {}).get('max_pages')
            max_products = job.get('config', {}).get('max_products')

            # Set environment variables for the scraper
            if categories:
                os.environ['CATEGORIES'] = ','.join(categories)
            if max_pages:
                os.environ['MAX_PAGES'] = str(max_pages)
            if max_products:
                os.environ['MAX_PRODUCTS'] = str(max_products)

            # Run the scraper
            exit_code = run_scraper()

            # Update status
            status = 'completed' if exit_code == 0 else 'failed'
            last_run_status = 'success' if exit_code == 0 else 'error'

            # Get the result path
            output_dir = os.environ.get('OUTPUT_DIR', 'data')
            results_dir = os.path.join(output_dir, 'results')
            result_files = []

            if os.path.exists(results_dir):
                for filename in os.listdir(results_dir):
                    filepath = os.path.join(results_dir, filename)
                    if os.path.isfile(filepath) and os.path.getmtime(filepath) > last_run_time.timestamp():
                        result_files.append(filename)

            # Update job with results
            creator_service.update_job_status(job_id, status, result_files[0] if result_files else None)

        except Exception as e:
            logger.exception(f"Error running job {job_id}: {str(e)}")
            last_run_status = 'error'
            creator_service.update_job_status(job_id, 'failed')

        finally:
            scraper_running = False

    # Start the thread
    thread = threading.Thread(target=run_job_thread)
    thread.daemon = True
    thread.start()

    return jsonify({
        'status': 'started',
        'message': f'Job {job_id} started successfully',
        'job': job
    })

@app.route('/categories', methods=['GET'])
def get_categories():
    """Get available categories for scraping."""
    categories = creator_service.get_available_categories()
    return jsonify({
        'status': 'success',
        'categories': categories
    })

def main():
    """Run the API server."""
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    main()
