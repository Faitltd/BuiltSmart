# Lowe's Scraper

A web-based scraper for Lowe's product data using the BigBox API.

## Overview

This application provides a web interface for scraping product data from Lowe's. It allows you to:

- Search by category
- Search by search terms
- Scrape specific product URLs
- Customize CSV headers
- Download results in CSV or JSON format

## Features

- 8-bit blue and white UI theme inspired by Lowe's branding
- Real-time job status updates
- Detailed process logs
- Ability to stop jobs and save partial results
- Customizable CSV headers
- Integration with the BigBox API

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Faitltd/Home-Depot-Scraper.git
cd Home-Depot-Scraper
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Create a `.env` file with your API key:
```
LOWES_API_KEY=D302834B9CC3400FA921A2F2D384ADD6
```

## Usage

### Running the Combined App

The combined app allows you to switch between the Home Depot and Lowe's scrapers:

```bash
python combined_app.py
```

This will start the web server at http://localhost:8080.

### Running the Lowe's Scraper Standalone

To run just the Lowe's scraper:

```bash
python lowes_app.py
```

This will start the web server at http://localhost:8081.

### Web Interface

1. Open your browser and navigate to http://localhost:8080/lowes (for combined app) or http://localhost:8081 (for standalone)
2. Choose a search type (Category, Search Term, or URL List)
3. Configure the search parameters
4. Customize CSV headers if needed
5. Click "Start Scraping"
6. Monitor the job progress and download results when complete

## API Endpoints

The Lowe's scraper provides the following API endpoints:

- `POST /lowes/api/start_job` - Start a new scraper job
- `GET /lowes/api/job/<job_id>` - Get job status
- `POST /lowes/api/stop_job/<job_id>` - Stop a running job
- `GET /lowes/api/download/<job_id>` - Download job results

## License

This project is licensed under the MIT License - see the LICENSE file for details.
