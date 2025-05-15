"""
Creator Microservice for Home Depot Scraper

This module provides functionality to create and manage scraping jobs
with custom names, link names, and descriptions.
"""

import os
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

# Configure logging
logger = logging.getLogger(__name__)

class ScraperJobCreator:
    """Creator service for managing scraping jobs."""
    
    def __init__(self, jobs_dir: str = "jobs"):
        """Initialize the job creator.
        
        Args:
            jobs_dir (str): Directory to store job definitions
        """
        self.jobs_dir = jobs_dir
        
        # Create jobs directory if it doesn't exist
        os.makedirs(jobs_dir, exist_ok=True)
        
        # Load existing jobs
        self.jobs = self._load_jobs()
    
    def _load_jobs(self) -> Dict[str, Dict[str, Any]]:
        """Load existing jobs from the jobs directory.
        
        Returns:
            Dict[str, Dict[str, Any]]: Dictionary of job ID to job definition
        """
        jobs = {}
        
        try:
            # List all job files
            for filename in os.listdir(self.jobs_dir):
                if filename.endswith('.json'):
                    job_path = os.path.join(self.jobs_dir, filename)
                    with open(job_path, 'r', encoding='utf-8') as f:
                        job_data = json.load(f)
                        job_id = job_data.get('id')
                        if job_id:
                            jobs[job_id] = job_data
        except Exception as e:
            logger.error(f"Error loading jobs: {str(e)}")
        
        logger.info(f"Loaded {len(jobs)} existing jobs")
        return jobs
    
    def create_job(self, 
                  name: str, 
                  link_name: str, 
                  description: str,
                  categories: Optional[List[str]] = None,
                  max_pages: Optional[int] = None,
                  max_products: Optional[int] = None) -> Dict[str, Any]:
        """Create a new scraping job.
        
        Args:
            name (str): Human-readable name for the job
            link_name (str): URL-friendly name for the job
            description (str): Description of the job
            categories (List[str], optional): List of categories to scrape
            max_pages (int, optional): Maximum pages to scrape per category
            max_products (int, optional): Maximum products to scrape
            
        Returns:
            Dict[str, Any]: Created job definition
        """
        # Generate a unique ID for the job
        job_id = str(uuid.uuid4())
        
        # Create job definition
        job = {
            'id': job_id,
            'name': name,
            'link_name': link_name,
            'description': description,
            'created_at': datetime.now().isoformat(),
            'status': 'created',
            'categories': categories or list(self.get_available_categories().keys()),
            'config': {
                'max_pages': max_pages,
                'max_products': max_products
            }
        }
        
        # Save job to file
        job_path = os.path.join(self.jobs_dir, f"{job_id}.json")
        with open(job_path, 'w', encoding='utf-8') as f:
            json.dump(job, f, indent=2)
        
        # Add to in-memory jobs
        self.jobs[job_id] = job
        
        logger.info(f"Created job: {name} (ID: {job_id})")
        return job
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get a job by ID.
        
        Args:
            job_id (str): Job ID
            
        Returns:
            Optional[Dict[str, Any]]: Job definition or None if not found
        """
        return self.jobs.get(job_id)
    
    def get_job_by_link_name(self, link_name: str) -> Optional[Dict[str, Any]]:
        """Get a job by link name.
        
        Args:
            link_name (str): Link name
            
        Returns:
            Optional[Dict[str, Any]]: Job definition or None if not found
        """
        for job in self.jobs.values():
            if job.get('link_name') == link_name:
                return job
        return None
    
    def list_jobs(self) -> List[Dict[str, Any]]:
        """List all jobs.
        
        Returns:
            List[Dict[str, Any]]: List of job definitions
        """
        return list(self.jobs.values())
    
    def update_job_status(self, job_id: str, status: str, 
                         result_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update a job's status.
        
        Args:
            job_id (str): Job ID
            status (str): New status
            result_path (str, optional): Path to the job results
            
        Returns:
            Optional[Dict[str, Any]]: Updated job definition or None if not found
        """
        job = self.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return None
        
        # Update status
        job['status'] = status
        job['updated_at'] = datetime.now().isoformat()
        
        # Add result path if provided
        if result_path:
            job['result_path'] = result_path
        
        # Save updated job
        job_path = os.path.join(self.jobs_dir, f"{job_id}.json")
        with open(job_path, 'w', encoding='utf-8') as f:
            json.dump(job, f, indent=2)
        
        logger.info(f"Updated job status: {job_id} -> {status}")
        return job
    
    def delete_job(self, job_id: str) -> bool:
        """Delete a job.
        
        Args:
            job_id (str): Job ID
            
        Returns:
            bool: True if the job was deleted, False otherwise
        """
        job = self.get_job(job_id)
        if not job:
            logger.error(f"Job not found: {job_id}")
            return False
        
        # Remove job file
        job_path = os.path.join(self.jobs_dir, f"{job_id}.json")
        try:
            os.remove(job_path)
        except Exception as e:
            logger.error(f"Error deleting job file: {str(e)}")
            return False
        
        # Remove from in-memory jobs
        del self.jobs[job_id]
        
        logger.info(f"Deleted job: {job_id}")
        return True
    
    def get_available_categories(self) -> Dict[str, str]:
        """Get available categories for scraping.
        
        Returns:
            Dict[str, str]: Dictionary of category name to category ID
        """
        from .scraper import CATEGORY_IDS
        return CATEGORY_IDS
