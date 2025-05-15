from setuptools import setup, find_packages
import os

# Read the contents of README.md if it exists
try:
    with open('README.md', encoding='utf-8') as f:
        long_description = f.read()
except FileNotFoundError:
    long_description = "Home Depot Building Materials Scraper"

setup(
    name="homedepot-scraper",
    version="1.0.0",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0",
        "python-dotenv>=0.19.0",
        "Flask>=2.0.1",
    ],
    entry_points={
        'console_scripts': [
            'homedepot-scraper=homedepot_scraper.cli:main',
            'homedepot-cloud=homedepot_scraper.cloud:main',
            'homedepot-api=homedepot_scraper.api_server:main',
        ],
    },
    author="Raymond Kinnee III",
    author_email="example@example.com",
    description="Home Depot Building Materials Scraper",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/homedepot-scraper",
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    python_requires='>=3.7',
)
