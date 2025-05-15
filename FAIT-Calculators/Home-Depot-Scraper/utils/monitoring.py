import time
import threading
from collections import defaultdict, deque
from functools import wraps
from flask import request, Blueprint, jsonify, current_app

# Create a blueprint for metrics endpoints
metrics_bp = Blueprint('metrics', __name__)

# Simple in-memory metrics store
class MetricsStore:
    def __init__(self, max_history=1000):
        self.max_history = max_history
        self.request_times = defaultdict(lambda: deque(maxlen=max_history))
        self.error_counts = defaultdict(int)
        self.job_metrics = defaultdict(lambda: {
            'total': 0,
            'completed': 0,
            'failed': 0,
            'running': 0,
            'products_scraped': 0,
            'avg_duration': 0
        })
        self.scraper_metrics = {
            'home_depot': {
                'requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'products_scraped': 0,
                'avg_request_time': 0
            },
            'lowes': {
                'requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'products_scraped': 0,
                'avg_request_time': 0
            }
        }
        self.lock = threading.Lock()
    
    def record_request_time(self, endpoint, duration):
        """Record the time taken to process a request"""
        with self.lock:
            self.request_times[endpoint].append(duration)
    
    def record_error(self, endpoint, error_type):
        """Record an error occurrence"""
        with self.lock:
            self.error_counts[f"{endpoint}:{error_type}"] += 1
    
    def update_job_metrics(self, job_type, status, products_scraped=0, duration=0):
        """Update job-related metrics"""
        with self.lock:
            self.job_metrics[job_type]['total'] += 1
            
            if status == 'COMPLETED':
                self.job_metrics[job_type]['completed'] += 1
                self.job_metrics[job_type]['products_scraped'] += products_scraped
                
                # Update average duration
                current_avg = self.job_metrics[job_type]['avg_duration']
                current_completed = self.job_metrics[job_type]['completed']
                
                if current_completed == 1:
                    self.job_metrics[job_type]['avg_duration'] = duration
                else:
                    # Calculate new average
                    self.job_metrics[job_type]['avg_duration'] = (
                        (current_avg * (current_completed - 1) + duration) / current_completed
                    )
            
            elif status == 'FAILED':
                self.job_metrics[job_type]['failed'] += 1
            
            elif status == 'RUNNING':
                self.job_metrics[job_type]['running'] += 1
    
    def update_scraper_metrics(self, scraper_type, success, products_scraped=0, request_time=0):
        """Update scraper-related metrics"""
        with self.lock:
            metrics = self.scraper_metrics.get(scraper_type)
            if not metrics:
                return
            
            metrics['requests'] += 1
            
            if success:
                metrics['successful_requests'] += 1
                metrics['products_scraped'] += products_scraped
                
                # Update average request time
                current_avg = metrics['avg_request_time']
                current_successful = metrics['successful_requests']
                
                if current_successful == 1:
                    metrics['avg_request_time'] = request_time
                else:
                    # Calculate new average
                    metrics['avg_request_time'] = (
                        (current_avg * (current_successful - 1) + request_time) / current_successful
                    )
            else:
                metrics['failed_requests'] += 1
    
    def get_metrics(self):
        """Get all metrics"""
        with self.lock:
            # Calculate average request times
            avg_request_times = {}
            for endpoint, times in self.request_times.items():
                if times:
                    avg_request_times[endpoint] = sum(times) / len(times)
                else:
                    avg_request_times[endpoint] = 0
            
            return {
                'request_metrics': {
                    'average_times': avg_request_times,
                    'error_counts': dict(self.error_counts)
                },
                'job_metrics': dict(self.job_metrics),
                'scraper_metrics': self.scraper_metrics
            }

# Create a global metrics store
metrics_store = MetricsStore()

# Request timing decorator
def time_request(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        try:
            response = f(*args, **kwargs)
            duration = time.time() - start_time
            
            # Record the request time
            endpoint = request.endpoint or 'unknown'
            metrics_store.record_request_time(endpoint, duration)
            
            return response
        except Exception as e:
            # Record the error
            endpoint = request.endpoint or 'unknown'
            error_type = type(e).__name__
            metrics_store.record_error(endpoint, error_type)
            raise
    return decorated_function

# Metrics endpoint
@metrics_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Get all metrics"""
    return jsonify(metrics_store.get_metrics())

# Function to record job metrics
def record_job_metrics(job_type, status, products_scraped=0, duration=0):
    """Record metrics for a job"""
    metrics_store.update_job_metrics(job_type, status, products_scraped, duration)

# Function to record scraper metrics
def record_scraper_metrics(scraper_type, success, products_scraped=0, request_time=0):
    """Record metrics for a scraper request"""
    metrics_store.update_scraper_metrics(scraper_type, success, products_scraped, request_time)