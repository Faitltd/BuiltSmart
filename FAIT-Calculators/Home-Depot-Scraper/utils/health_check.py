import os
import time
import psutil
import platform
import socket
from datetime import datetime
from flask import Blueprint, jsonify

# Create a blueprint for health check endpoints
health_bp = Blueprint('health', __name__)

# Track application start time
start_time = time.time()

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat()
    })

@health_bp.route('/health/detailed', methods=['GET'])
def detailed_health_check():
    """Detailed health check with system information"""
    # Calculate uptime
    uptime_seconds = time.time() - start_time
    
    # Get system information
    system_info = {
        'platform': platform.platform(),
        'python_version': platform.python_version(),
        'hostname': socket.gethostname()
    }
    
    # Get resource usage
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    resource_usage = {
        'cpu_percent': process.cpu_percent(interval=0.1),
        'memory_usage_mb': memory_info.rss / (1024 * 1024),
        'memory_percent': process.memory_percent(),
        'threads': process.num_threads(),
        'open_files': len(process.open_files())
    }
    
    # Check disk space
    disk_usage = psutil.disk_usage('/')
    disk_info = {
        'total_gb': disk_usage.total / (1024 * 1024 * 1024),
        'used_gb': disk_usage.used / (1024 * 1024 * 1024),
        'free_gb': disk_usage.free / (1024 * 1024 * 1024),
        'percent_used': disk_usage.percent
    }
    
    # Check if output directory exists and is writable
    output_dir = os.environ.get('OUTPUT_DIR', 'data')
    output_dir_status = {
        'exists': os.path.exists(output_dir),
        'writable': os.access(output_dir, os.W_OK) if os.path.exists(output_dir) else False
    }
    
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'uptime_seconds': uptime_seconds,
        'system_info': system_info,
        'resource_usage': resource_usage,
        'disk_info': disk_info,
        'output_directory': output_dir_status
    })

@health_bp.route('/health/ready', methods=['GET'])
def readiness_check():
    """
    Readiness check to determine if the application is ready to serve requests.
    This is useful for Kubernetes readiness probes.
    """
    # Check if essential services are available
    checks = {
        'output_directory': check_output_directory(),
        'memory_available': check_memory_available(),
        'disk_space': check_disk_space()
    }
    
    # If any check fails, return 503 Service Unavailable
    if not all(checks.values()):
        return jsonify({
            'status': 'not_ready',
            'checks': checks,
            'timestamp': datetime.now().isoformat()
        }), 503
    
    return jsonify({
        'status': 'ready',
        'checks': checks,
        'timestamp': datetime.now().isoformat()
    })

def check_output_directory():
    """Check if output directory exists and is writable"""
    output_dir = os.environ.get('OUTPUT_DIR', 'data')
    return os.path.exists(output_dir) and os.access(output_dir, os.W_OK)

def check_memory_available():
    """Check if there's enough memory available"""
    # Require at least 100MB of free memory
    return psutil.virtual_memory().available > 100 * 1024 * 1024

def check_disk_space():
    """Check if there's enough disk space available"""
    # Require at least 500MB of free space
    return psutil.disk_usage('/').free > 500 * 1024 * 1024