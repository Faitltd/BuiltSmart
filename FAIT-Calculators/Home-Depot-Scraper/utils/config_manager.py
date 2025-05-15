import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger('scraper.config')

class ConfigManager:
    def __init__(self, config_dir='config'):
        """
        Initialize the configuration manager
        
        Args:
            config_dir: Directory containing configuration files
        """
        self.config_dir = config_dir
        self.config = {}
        
        # Create config directory if it doesn't exist
        os.makedirs(config_dir, exist_ok=True)
        
        # Load environment variables from .env file
        load_dotenv()
        
        # Load configuration from files
        self.load_config()

    def load_config(self):
        """Load configuration from files and environment variables"""
        # Load base configuration
        base_config_path = os.path.join(self.config_dir, 'config.json')
        if os.path.exists(base_config_path):
            try:
                with open(base_config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Loaded base configuration from {base_config_path}")
            except Exception as e:
                logger.error(f"Failed to load base configuration: {str(e)}")
        
        # Load environment-specific configuration
        env = os.environ.get('ENVIRONMENT', 'development')
        env_config_path = os.path.join(self.config_dir, f'config.{env}.json')
        if os.path.exists(env_config_path):
            try:
                with open(env_config_path, 'r') as f:
                    env_config = json.load(f)
                    # Merge with base configuration
                    self._deep_merge(self.config, env_config)
                logger.info(f"Loaded {env} configuration from {env_config_path}")
            except Exception as e:
                logger.error(f"Failed to load {env} configuration: {str(e)}")
        
        # Override with environment variables
        self._load_from_env()
    
    def _deep_merge(self, target, source):
        """Deep merge two dictionaries"""
        for key, value in source.items():
            if key in target and isinstance(target[key], dict) and isinstance(value, dict):
                self._deep_merge(target[key], value)
            else:
                target[key] = value
    
    def _load_from_env(self):
        """Load configuration from environment variables"""
        # Look for environment variables with the prefix SCRAPER_
        for key, value in os.environ.items():
            if key.startswith('SCRAPER_'):
                # Convert SCRAPER_SECTION_KEY to section.key
                config_key = key[8:].lower().replace('_', '.')
                self._set_nested_value(self.config, config_key, value)
    
    def _set_nested_value(self, config, key_path, value):
        """Set a nested value in the configuration dictionary"""
        keys = key_path.split('.')
        current = config
        
        # Navigate to the correct nested dictionary
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        # Set the value, converting to appropriate type
        current[keys[-1]] = self._convert_value(value)
    
    def _convert_value(self, value):
        """Convert string value to appropriate type"""
        # Try to convert to boolean
        if value.lower() in ('true', 'yes', '1'):
            return True
        if value.lower() in ('false', 'no', '0'):
            return False
        
        # Try to convert to number
        try:
            if '.' in value:
                return float(value)
            return int(value)
        except ValueError:
            # Keep as string
            return value
    
    def get(self, key, default=None):
        """
        Get a configuration value
        
        Args:
            key: Configuration key (can be nested using dot notation)
            default: Default value if key is not found
        
        Returns:
            The configuration value or default
        """
        keys = key.split('.')
        current = self.config
        
        # Navigate through the nested dictionaries
        for k in keys:
            if not isinstance(current, dict) or k not in current:
                return default
            current = current[k]
        
        return current
    
    def set(self, key, value, save=False):
        """
        Set a configuration value
        
        Args:
            key: Configuration key (can be nested using dot notation)
            value: Value to set
            save: Whether to save the configuration to file
        """
        self._set_nested_value(self.config, key, value)
        
        if save:
            self.save_config()
    
    def save_config(self):
        """Save configuration to file"""
        base_config_path = os.path.join(self.config_dir, 'config.json')
        try:
            with open(base_config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Saved configuration to {base_config_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save configuration: {str(e)}")
            return False
    
    def get_all(self):
        """Get the entire configuration dictionary"""
        return self.config.copy()
    
    def get_section(self, section):
        """
        Get a configuration section
        
        Args:
            section: Section name
        
        Returns:
            The section dictionary or None if not found
        """
        return self.config.get(section, {}).copy()
