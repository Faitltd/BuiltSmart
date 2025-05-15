"""
Custom log handler for capturing scraper logs.

This module provides a custom log handler that captures log messages from the scraper
and adds them to the job's log messages.
"""

import logging
from datetime import datetime

class JobLogHandler(logging.Handler):
    """Custom log handler that captures log messages and adds them to a job's log messages."""

    def __init__(self, job):
        """Initialize the handler with a job object.
        
        Args:
            job: The job object that has a log_messages attribute
        """
        super().__init__()
        self.job = job

    def emit(self, record):
        """Process a log record and add it to the job's log messages.
        
        Args:
            record: The log record to process
        """
        # Format the log message
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_message = f"[{timestamp}] {record.getMessage()}"
        
        # Add the log message to the job's log messages
        if hasattr(self.job, 'log_messages'):
            self.job.log_messages.append(log_message)
            
            # Limit log messages to the last 1000
            if len(self.job.log_messages) > 1000:
                self.job.log_messages = self.job.log_messages[-1000:]
