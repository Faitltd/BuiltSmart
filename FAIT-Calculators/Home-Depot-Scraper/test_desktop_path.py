#!/usr/bin/env python3
"""
Test script to verify Desktop path handling in different environments.
"""

import os
import platform
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def is_cloud_environment():
    """Detect if we're running in a cloud environment."""
    # Check for environment variables that would be present in Cloud Run
    if os.environ.get('K_SERVICE') or os.environ.get('CLOUD_RUN_JOB'):
        return True
    
    # Check if we're running as the appuser (from Dockerfile)
    if os.environ.get('USER') == 'appuser':
        return True
    
    # Check if we're on Linux and not on a typical desktop distribution
    if platform.system() == 'Linux':
        # Most cloud environments use container-optimized Linux
        if os.path.exists('/.dockerenv') or os.path.exists('/.containerenv'):
            return True
    
    return False

def test_desktop_path():
    """Test Desktop path handling."""
    # Check if we're in a cloud environment
    in_cloud = is_cloud_environment()
    logger.info(f"Running in cloud environment: {in_cloud}")
    
    # Test different Desktop path formats
    desktop_paths = [
        'Desktop',
        '/Desktop',
        'desktop/',
        '/desktop/'
    ]
    
    for path in desktop_paths:
        if in_cloud:
            # In cloud environment, use a special directory within the app's data directory
            output_dir = os.path.join('data', 'desktop')
            logger.info(f"For '{path}' using cloud-friendly Desktop directory: {os.path.abspath(output_dir)}")
        else:
            # Use the actual Desktop path on macOS/Windows
            output_dir = os.path.join(os.path.expanduser('~'), 'Desktop')
            logger.info(f"For '{path}' using local Desktop directory: {output_dir}")
        
        # Ensure the directory exists
        try:
            os.makedirs(output_dir, exist_ok=True)
            logger.info(f"Successfully created directory: {output_dir}")
            
            # Try to write a test file
            test_file = os.path.join(output_dir, 'test_file.txt')
            with open(test_file, 'w') as f:
                f.write('Test file for Desktop path handling')
            logger.info(f"Successfully wrote test file to: {test_file}")
            
            # Clean up
            os.remove(test_file)
            logger.info(f"Successfully removed test file: {test_file}")
        except Exception as e:
            logger.error(f"Error working with directory {output_dir}: {str(e)}")

if __name__ == '__main__':
    logger.info("Starting Desktop path test")
    test_desktop_path()
    logger.info("Desktop path test completed")
