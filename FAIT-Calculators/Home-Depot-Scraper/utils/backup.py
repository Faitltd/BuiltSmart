import os
import shutil
import json
import time
import logging
import zipfile
from datetime import datetime
from pathlib import Path

logger = logging.getLogger('scraper.backup')

class BackupManager:
    def __init__(self, backup_dir='backups', max_backups=10):
        """
        Initialize the backup manager
        
        Args:
            backup_dir: Directory to store backups
            max_backups: Maximum number of backups to keep
        """
        self.backup_dir = backup_dir
        self.max_backups = max_backups
        
        # Create backup directory if it doesn't exist
        os.makedirs(backup_dir, exist_ok=True)
    
    def backup_job_data(self, job_id, data_dir):
        """
        Backup data for a specific job
        
        Args:
            job_id: ID of the job
            data_dir: Directory containing job data
        
        Returns:
            str: Path to the backup file
        """
        if not os.path.exists(data_dir):
            logger.warning(f"Cannot backup job {job_id}: data directory {data_dir} does not exist")
            return None
        
        # Create a timestamp for the backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"job_{job_id}_{timestamp}.zip"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        try:
            # Create a zip file containing the job data
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(data_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, os.path.dirname(data_dir))
                        zipf.write(file_path, arcname)
            
            logger.info(f"Backed up job {job_id} to {backup_path}")
            return backup_path
        except Exception as e:
            logger.error(f"Failed to backup job {job_id}: {str(e)}")
            return None
    
    def backup_all_jobs(self, jobs_dir):
        """
        Backup data for all jobs
        
        Args:
            jobs_dir: Directory containing all job data
        
        Returns:
            str: Path to the backup file
        """
        if not os.path.exists(jobs_dir):
            logger.warning(f"Cannot backup jobs: directory {jobs_dir} does not exist")
            return None
        
        # Create a timestamp for the backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"all_jobs_{timestamp}.zip"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        try:
            # Create a zip file containing all job data
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(jobs_dir):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, jobs_dir)
                        zipf.write(file_path, arcname)
            
            logger.info(f"Backed up all jobs to {backup_path}")
            return backup_path
        except Exception as e:
            logger.error(f"Failed to backup all jobs: {str(e)}")
            return None
    
    def restore_job(self, backup_path, restore_dir):
        """
        Restore a job from a backup
        
        Args:
            backup_path: Path to the backup file
            restore_dir: Directory to restore to
        
        Returns:
            bool: True if successful, False otherwise
        """
        if not os.path.exists(backup_path):
            logger.warning(f"Cannot restore job: backup file {backup_path} does not exist")
            return False
        
        try:
            # Create the restore directory if it doesn't exist
            os.makedirs(restore_dir, exist_ok=True)
            
            # Extract the backup file
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(restore_dir)
            
            logger.info(f"Restored job from {backup_path} to {restore_dir}")
            return True
        except Exception as e:
            logger.error(f"Failed to restore job from {backup_path}: {str(e)}")
            return False
    
    def cleanup_old_backups(self):
        """
        Remove old backups to stay within the maximum limit
        
        Returns:
            int: Number of backups removed
        """
        try:
            # Get all backup files
            backup_files = [f for f in os.listdir(self.backup_dir) if f.endswith('.zip')]
            
            # If we're under the limit, no need to clean up
            if len(backup_files) <= self.max_backups:
                return 0
            
            # Sort by modification time (oldest first)
            backup_files.sort(key=lambda f: os.path.getmtime(os.path.join(self.backup_dir, f)))
            
            # Remove oldest backups
            to_remove = len(backup_files) - self.max_backups
            removed = 0
            
            for i in range(to_remove):
                try:
                    os.remove(os.path.join(self.backup_dir, backup_files[i]))
                    removed += 1
                except Exception as e:
                    logger.error(f"Failed to remove old backup {backup_files[i]}: {str(e)}")
            
            logger.info(f"Removed {removed} old backups")
            return removed
        except Exception as e:
            logger.error(f"Failed to clean up old backups: {str(e)}")
            return 0