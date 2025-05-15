# Home Depot Building Materials Scraper

A comprehensive scraper for Home Depot's building materials category and subcategories. This tool extracts product data including names, descriptions, SKUs, URLs, prices, and detailed specifications.

## Features

- Scrapes all building materials subcategories:
  - Lumber & Composites
  - Concrete, Cement & Masonry
  - Decking
  - Fencing
  - Moulding & Millwork
  - Insulation
  - Drywall
  - Roofing
  - Gutter Systems
  - Plywood
  - Boards, Planks & Panels
  - Siding
  - Ladders
  - Dimensional Lumber
  - Building Hardware
  - Ventilation
  - Ceilings
  - Tools

- Extracts comprehensive product data:
  - Product name
  - Description
  - SKU/Item ID
  - URL
  - Price
  - Detailed specifications
  - Features

- Multiple output formats:
  - CSV export
  - JSON export
  - Optional Zoho Books integration
  - Customizable CSV headers

- Cloud-ready:
  - Containerized for easy deployment
  - Scheduled weekly execution
  - API for triggering and retrieving results

- Web Interface:
  - User-friendly web application
  - Multiple search type options
  - CSV header customization
  - Job management and monitoring

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/homedepot-scraper.git
cd homedepot-scraper

# Install the package
pip install -e .
```

### Docker Installation

```bash
# Build the Docker image
docker build -t homedepot-scraper .

# Run the container
docker run -e BIGBOX_API_KEY=your_api_key -v $(pwd)/data:/app/data homedepot-scraper
```

## Usage

### Web Application

```bash
# Start the web application
python app.py
```

Then open your browser and navigate to `http://localhost:8080`.

The web interface allows you to:
- Select different search types (Category, Search Term, or URL List)
- Customize CSV headers with standardized defaults
- Monitor job progress in real-time
- Download results when complete
- Uses the API key from your environment variables (no need to enter it in the UI)

### Command Line

```bash
# Run the scraper with your API key (categories mode)
python -m homedepot_scraper.cli --mode categories --api-key YOUR_API_KEY --output-dir data --format csv

# Scrape by search terms
python -m homedepot_scraper.cli --mode search --search-terms "lumber" "plywood" --max-pages 3

# Scrape specific URLs from a file
python -m homedepot_scraper.cli --mode url --urls-file product_urls.txt --template

# Limit the number of pages or products
python -m homedepot_scraper.cli --api-key YOUR_API_KEY --max-pages 5 --max-products 100

# Update Zoho Books with scraped data
python -m homedepot_scraper.cli --api-key YOUR_API_KEY --update-zoho --zoho-config zoho_config.json
```

### Python API

```python
from homedepot_scraper.scraper import HomeDepotScraper

# Initialize the scraper
scraper = HomeDepotScraper(api_key="YOUR_API_KEY", output_dir="data")

# Scrape all categories
scraper.scrape_all_categories()

# OR scrape by search terms
search_terms = ["lumber", "plywood"]
scraper.scrape_search_terms(search_terms)

# OR scrape specific URLs
urls = [
    "https://www.homedepot.com/p/product-name/123456789",
    "https://www.homedepot.com/p/another-product/987654321"
]
scraper.scrape_specific_urls(urls)

# Fetch detailed product information
scraper.fetch_product_details()

# Save results
csv_file = scraper.save_results(format="csv")
json_file = scraper.save_results(format="json")

# OR save with template format
template_file = scraper.save_results_template()
```

## ⚠️ Important Note on API Key

**API Key Security**

For security reasons, the API key is now stored in the `.env` file and not hardcoded in the application.

To use the API clients in this project, you'll need to:
1. Create a `.env` file in the `config` directory (copy from `.env.sample`)
2. Add your BigBox API key to the `.env` file: `BIGBOX_API_KEY=your_api_key_here`
3. Or set it as an environment variable: `export BIGBOX_API_KEY=your_api_key_here`

If you need a new API key, you can get one from [BigBox API](https://www.bigboxapi.com/).

## Cloud Deployment

### Google Cloud Run

This project is configured to deploy to Google Cloud Run in the `fait-444705` project. You can deploy it using the provided deployment script:

```bash
# Make the script executable
chmod +x deploy_to_cloud.sh

# Run the deployment script
./deploy_to_cloud.sh
```

The script will:
1. Configure gcloud CLI to use the correct project
2. Build the Docker image
3. Push the image to Google Container Registry
4. Deploy to Cloud Run
5. Display the URL of the deployed application

Alternatively, you can deploy manually:

1. Build and push the Docker image:

```bash
# Build the image
docker build -t gcr.io/fait-444705/homedepot-scraper .

# Push to Google Container Registry
docker push gcr.io/fait-444705/homedepot-scraper
```

2. Deploy to Cloud Run:

```bash
gcloud run deploy homedepot-scraper \
  --image gcr.io/fait-444705/homedepot-scraper \
  --platform managed \
  --region us-central1 \
  --memory 2Gi \
  --timeout 3600 \
  --allow-unauthenticated \
  --set-env-vars BIGBOX_API_KEY=52323740B6D14CBE81D81C81E0DD32E6
```

3. Set up Cloud Scheduler for weekly execution:

```bash
gcloud scheduler jobs create http homedepot-weekly-scraper \
  --schedule="0 2 * * 0" \
  --uri="https://YOUR_CLOUD_RUN_URL/run" \
  --http-method=POST \
  --time-zone="America/New_York"
```

## API Endpoints

The scraper provides a simple API when running in cloud mode:

- `GET /health` - Health check endpoint
- `GET /status` - Get the current status of the scraper
- `POST /run` - Trigger the scraper to run
- `GET /results` - List available result files
- `GET /results/{filename}` - Download a specific result file

## Configuration

### Environment Variables

- `BIGBOX_API_KEY` - Your BigBox API key
- `OUTPUT_DIR` - Directory to store output data (default: `data`)
- `MAX_PAGES` - Maximum number of pages to scrape per category
- `MAX_PRODUCTS` - Maximum number of products to scrape
- `REQUEST_DELAY` - Delay between API requests in seconds (default: `1.0`)

### Zoho Books Integration

To integrate with Zoho Books, create a `zoho_config.json` file:

```json
{
  "client_id": "YOUR_ZOHO_CLIENT_ID",
  "client_secret": "YOUR_ZOHO_CLIENT_SECRET",
  "organization_id": "YOUR_ZOHO_ORGANIZATION_ID",
  "refresh_token": "YOUR_ZOHO_REFRESH_TOKEN"
}
```

## Additional Notes

- The BigBox API typically returns results within 1-6 seconds
- Each API request uses 1 credit from your quota
- Free accounts have limited credits
- The scraper automatically handles rate limiting and retries

## Providing URLs

The best way to provide URLs for the scraper is to create a text file with one URL per line:

```
https://www.homedepot.com/p/product-name/123456789
https://www.homedepot.com/p/another-product/987654321
https://www.homedepot.com/p/third-product/456789123
```

Then use the `--urls-file` parameter:

```bash
python -m homedepot_scraper.cli --mode url --urls-file your_url_list.txt
```

For best results, clean URLs by removing query parameters (everything after the ? in the URL).

## License

MIT

## Weekly Scraping

### Running the Weekly Scraper

The scraper can be run in two ways:

1. Using the scheduling script:
```bash
./schedule_weekly_scraper.sh
```

2. Directly using Python:
```bash
python3 improved_weekly_scraper.py
```

### File Locations
All scraper files are organized in the homedepot_scraper package.

### Components
1. Weekly Scraper Script (improved_weekly_scraper.py)
   - Handles category browsing and product detail extraction
   - Generates date-stamped CSV files
   - Saves raw JSON data

2. Scheduler Script (schedule_weekly_scraper.sh)
   - Runs the scraper and logs results
   - Designed for cron job scheduling

## Testing

### Cypress Tests

The project includes Cypress tests for the web interface. These tests verify that the UI components work correctly and that the application behaves as expected.

#### Running Cypress Tests

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the web application:
```bash
python app.py
```

3. Run the Cypress tests:
```bash
# Run tests in headless mode
npm run cypress:run

# Or open the Cypress Test Runner for interactive testing
npm run cypress:open
```

#### Test Coverage

The Cypress tests cover:
- Home page configuration options
- Job details page functionality
- Jobs list page navigation
- Form validation and submission
- Directory validation
- CSV header customization

For more details, see the [Cypress README](cypress/README.md).
