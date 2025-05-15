"""
Main entry point for the Home Depot Scraper package.

This module provides a command-line interface for the Home Depot scraper.
"""

import sys
from .cli import main

if __name__ == "__main__":
    sys.exit(main())
