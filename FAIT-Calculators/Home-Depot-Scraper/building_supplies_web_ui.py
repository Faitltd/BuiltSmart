#!/usr/bin/env python3
"""
Web-based UI for the Home Depot Building Supplies scraper.
Uses Python's built-in http.server to create a simple web interface.
"""

import http.server
import socketserver
import urllib.parse
import json
import os
import threading
import time
import webbrowser
from datetime import datetime
import urllib.request
import urllib.error

# Building Supplies category ID on Home Depot
BUILDING_SUPPLIES_CATEGORY = "N-5yc1vZaqns"

# Global variables
OUTPUT_DIR = os.path.join(os.getcwd(), "building_supplies_data")
API_KEY = "52323740B6D14CBE81D81C81E0DD32E6"
is_scraping = False
scraper_thread = None
log_messages = []
collected_count = 0
total_count = 0
current_page = 0
total_pages = 0

def log(message):
    """Add a log message to the global log list"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    log_messages.append(log_entry)
    print(log_entry)

def get_category_data(category_id, page=1):
    """Get data for a specific category from the BigBox API."""
    base_url = "https://api.bigboxapi.com/request"

    # Prepare parameters
    params = {
        'api_key': API_KEY,
        'type': 'category',
        'category_id': category_id,
        'page': page
    }

    # Construct the URL with parameters
    query_string = urllib.parse.urlencode(params)
    request_url = f"{base_url}?{query_string}"

    log(f"Requesting: {request_url}")

    try:
        # Make the HTTP request
        with urllib.request.urlopen(request_url) as response:
            # Read and parse the response
            response_data = response.read().decode('utf-8')
            data = json.loads(response_data)

            # Check for API credits information
            if 'request_info' in data:
                credits_used = data['request_info'].get('credits_used', 0)
                credits_remaining = data['request_info'].get('credits_remaining', 0)
                log(f"API Credits - Used: {credits_used}, Remaining: {credits_remaining}")

            return data
    except urllib.error.HTTPError as e:
        log(f"HTTP Error: {e.code} - {e.reason}")
        return None
    except urllib.error.URLError as e:
        log(f"URL Error: {e.reason}")
        return None
    except json.JSONDecodeError:
        log("Error: Failed to parse the response as JSON")
        return None

def get_product_data(item_id):
    """Get data for a specific product from the BigBox API."""
    base_url = "https://api.bigboxapi.com/request"

    # Prepare parameters
    params = {
        'api_key': API_KEY,
        'type': 'product',
        'item_id': item_id
    }

    # Construct the URL with parameters
    query_string = urllib.parse.urlencode(params)
    request_url = f"{base_url}?{query_string}"

    try:
        # Make the HTTP request
        with urllib.request.urlopen(request_url) as response:
            # Read and parse the response
            response_data = response.read().decode('utf-8')
            data = json.loads(response_data)

            # Check for API credits information
            if 'request_info' in data:
                credits_used = data['request_info'].get('credits_used', 0)
                credits_remaining = data['request_info'].get('credits_remaining', 0)
                log(f"API Credits - Used: {credits_used}, Remaining: {credits_remaining}")

            return data
    except urllib.error.HTTPError as e:
        log(f"HTTP Error: {e.code} - {e.reason}")
        return None
    except urllib.error.URLError as e:
        log(f"URL Error: {e.reason}")
        return None
    except json.JSONDecodeError:
        log("Error: Failed to parse the response as JSON")
        return None

def scrape_building_supplies(max_pages=None, max_products=None):
    """Main function to scrape the Building Supplies category."""
    global is_scraping, collected_count, total_count, current_page, total_pages

    try:
        log(f"Fetching Building Supplies category data (ID: {BUILDING_SUPPLIES_CATEGORY})...")

        # Create output directory if it doesn't exist
        if not os.path.exists(OUTPUT_DIR):
            os.makedirs(OUTPUT_DIR)
            log(f"Created output directory: {OUTPUT_DIR}")

        # Get first page to determine total pages
        category_data = get_category_data(BUILDING_SUPPLIES_CATEGORY)
        if not category_data:
            log("Failed to retrieve category data")
            is_scraping = False
            return

        # Extract pagination info
        total_pages = category_data.get('pagination', {}).get('total_pages', 0)
        total_count = category_data.get('pagination', {}).get('total_results', 0)

        # Apply limits if specified
        if max_pages and max_pages < total_pages:
            total_pages = max_pages
            log(f"Limiting to {max_pages} pages as specified")

        log(f"Found {total_count} products across {total_pages} pages")

        # Create a list to store all products
        all_products = []
        collected_count = 0

        # Process each page
        for page in range(1, total_pages + 1):
            if not is_scraping:
                log("Scraping stopped by user")
                break

            current_page = page
            log(f"Processing page {page} of {total_pages}...")

            # Get category data for current page (reuse first page data if already fetched)
            if page == 1:
                page_data = category_data
            else:
                page_data = get_category_data(BUILDING_SUPPLIES_CATEGORY, page)

            if not page_data:
                log(f"Failed to retrieve data for page {page}")
                continue

            # Extract products from the page
            products = page_data.get('search_results', [])
            log(f"Found {len(products)} products on page {page}")

            # Save the page data
            page_file = os.path.join(OUTPUT_DIR, f"page_{page}.json")
            with open(page_file, 'w') as f:
                json.dump(page_data, f, indent=2)

            # Process each product
            for product in products:
                if not is_scraping:
                    log("Scraping stopped by user")
                    break

                # Check if we've reached the maximum number of products
                if max_products and collected_count >= max_products:
                    log(f"Reached maximum product limit of {max_products}")
                    break

                if 'product' not in product:
                    continue

                product_info = product['product']
                item_id = product_info.get('item_id')

                if not item_id:
                    continue

                # Log product being processed
                title = product_info.get('title', 'Unknown Product')
                log(f"Processing product: {title} (ID: {item_id})")

                # Get detailed product data
                detailed_product = get_product_data(item_id)
                if detailed_product:
                    # Save product data to file
                    product_file = os.path.join(OUTPUT_DIR, f"product_{item_id}.json")
                    with open(product_file, 'w') as f:
                        json.dump(detailed_product, f, indent=2)

                    # Add to our list
                    all_products.append(detailed_product)

                    # Update progress
                    collected_count += 1
                    log(f"Progress: {collected_count}/{total_count} products collected")

                # Brief pause to avoid overloading the API
                time.sleep(0.5)

            # Check if we've reached the maximum number of products
            if max_products and collected_count >= max_products:
                log(f"Reached maximum product limit of {max_products}")
                break

            # Pause between pages to avoid overloading the API
            time.sleep(1)

        # Save all products to a single file
        all_products_file = os.path.join(OUTPUT_DIR, "all_products.json")
        with open(all_products_file, 'w') as f:
            json.dump(all_products, f, indent=2)

        log(f"Scraping completed. Collected {collected_count} products.")
        log(f"Results saved to: {OUTPUT_DIR}")

    except Exception as e:
        log(f"Error during scraping: {str(e)}")

    finally:
        is_scraping = False


class ScraperHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler for the scraper web UI."""

    def do_GET(self):
        """Handle GET requests."""
        global API_KEY, OUTPUT_DIR, is_scraping, log_messages

        # Parse the URL
        parsed_url = urllib.parse.urlparse(self.path)

        # Home page
        if parsed_url.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            # HTML for the home page
            html = """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Home Depot Building Supplies Scraper</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        padding: 20px;
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    h1 {
                        color: #f96302;
                        border-bottom: 2px solid #f96302;
                        padding-bottom: 10px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }
                    input[type="text"],
                    input[type="number"] {
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 15px;
                        border: 1px solid #ddd;
                        border-radius: 4px;
                        box-sizing: border-box;
                    }
                    button {
                        background-color: #f96302;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 16px;
                    }
                    button:hover {
                        background-color: #e55d00;
                    }
                    button:disabled {
                        background-color: #cccccc;
                        cursor: not-allowed;
                    }
                    .log {
                        background-color: #f5f5f5;
                        border: 1px solid #ddd;
                        height: 300px;
                        overflow-y: auto;
                        padding: 10px;
                        font-family: monospace;
                        white-space: pre-wrap;
                        border-radius: 4px;
                    }
                    .progress {
                        margin-top: 20px;
                        background-color: #f5f5f5;
                        border-radius: 4px;
                    }
                    .progress-bar {
                        height: 20px;
                        background-color: #f96302;
                        border-radius: 4px;
                        width: 0%;
                        transition: width 0.3s;
                    }
                    .progress-text {
                        text-align: center;
                        margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>Home Depot Building Supplies Scraper</h1>

                <div class="container">
                    <form id="scraper-form">
                        <label for="api-key">API Key:</label>
                        <input type="text" id="api-key" value="{api_key}" required>

                        <label for="output-dir">Output Directory:</label>
                        <input type="text" id="output-dir" value="{output_dir}" required>

                        <label for="max-pages">Maximum Pages (optional):</label>
                        <input type="number" id="max-pages" min="1">

                        <label for="max-products">Maximum Products (optional):</label>
                        <input type="number" id="max-products" min="1">

                        <button type="submit" id="start-button">Start Scraping</button>
                        <button type="button" id="stop-button" disabled>Stop</button>
                        <button type="button" id="view-results">View Results</button>
                    </form>
                </div>

                <div class="container">
                    <h2>Progress</h2>
                    <div class="progress">
                        <div class="progress-bar" id="progress-bar"></div>
                    </div>
                    <div class="progress-text" id="progress-text">Ready to start</div>

                    <h2>Log</h2>
                    <div class="log" id="log"></div>
                </div>

                <script>
                    // Update log and progress every second
                    setInterval(function() {{
                        fetch('/status')
                            .then(response => response.json())
                            .then(data => {{
                                // Update log
                                const logElement = document.getElementById('log');
                                logElement.innerHTML = data.log.join('\\n');
                                logElement.scrollTop = logElement.scrollHeight;

                                // Update progress
                                const progressBar = document.getElementById('progress-bar');
                                const progressText = document.getElementById('progress-text');

                                if (data.total_pages > 0) {{
                                    const pageProgress = (data.current_page / data.total_pages) * 100;
                                    progressBar.style.width = pageProgress + '%';
                                    progressText.textContent = `Page ${data.current_page} of ${data.total_pages}, Products: ${data.collected_count} of ${data.total_count}`;
                                }}

                                // Update buttons
                                document.getElementById('start-button').disabled = data.is_scraping;
                                document.getElementById('stop-button').disabled = !data.is_scraping;
                            }});
                    }}, 1000);

                    // Form submission
                    document.getElementById('scraper-form').addEventListener('submit', function(e) {{
                        e.preventDefault();

                        const apiKey = document.getElementById('api-key').value;
                        const outputDir = document.getElementById('output-dir').value;
                        const maxPages = document.getElementById('max-pages').value;
                        const maxProducts = document.getElementById('max-products').value;

                        const url = `/start?api_key=${encodeURIComponent(apiKey)}&output_dir=${encodeURIComponent(outputDir)}` +
                                   (maxPages ? `&max_pages=${maxPages}` : '') +
                                   (maxProducts ? `&max_products=${maxProducts}` : '');

                        fetch(url)
                            .then(response => {{
                                if (!response.ok) throw new Error('Failed to start scraping');
                                return response.json();
                            }})
                            .then(data => {{
                                console.log('Scraping started');
                            }})
                            .catch(error => {{
                                console.error('Error:', error);
                                alert('Failed to start scraping: ' + error.message);
                            }});
                    }});

                    // Stop button
                    document.getElementById('stop-button').addEventListener('click', function() {{
                        fetch('/stop')
                            .then(response => {{
                                if (!response.ok) throw new Error('Failed to stop scraping');
                                return response.json();
                            }})
                            .then(data => {{
                                console.log('Scraping stopped');
                            }})
                            .catch(error => {{
                                console.error('Error:', error);
                                alert('Failed to stop scraping: ' + error.message);
                            }});
                    }});

                    // View results button
                    document.getElementById('view-results').addEventListener('click', function() {{
                        const outputDir = document.getElementById('output-dir').value;
                        window.open(`/view?dir=${encodeURIComponent(outputDir)}`, '_blank');
                    }});
                </script>
            </body>
            </html>
            """.format(api_key=API_KEY, output_dir=OUTPUT_DIR)

            self.wfile.write(html.encode())
            return

        # Status endpoint
        elif parsed_url.path == '/status':
            global is_scraping, log_messages, collected_count, total_count, current_page, total_pages

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            status = {
                'is_scraping': is_scraping,
                'log': log_messages,
                'collected_count': collected_count,
                'total_count': total_count,
                'current_page': current_page,
                'total_pages': total_pages
            }

            self.wfile.write(json.dumps(status).encode())
            return

        # Start scraping endpoint
        elif parsed_url.path.startswith('/start'):
            global scraper_thread, is_scraping

            if is_scraping:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Scraping already in progress'}).encode())
                return

            # Parse query parameters
            query = urllib.parse.parse_qs(parsed_url.query)

            # Get parameters
            API_KEY = query.get('api_key', [API_KEY])[0]
            OUTPUT_DIR = query.get('output_dir', [OUTPUT_DIR])[0]
            max_pages = query.get('max_pages', [None])[0]
            max_products = query.get('max_products', [None])[0]

            # Convert to int if not None
            if max_pages:
                max_pages = int(max_pages)
            if max_products:
                max_products = int(max_products)

            # Clear log
            log_messages.clear()

            # Start scraping in a new thread
            is_scraping = True
            scraper_thread = threading.Thread(
                target=scrape_building_supplies,
                args=(max_pages, max_products)
            )
            scraper_thread.daemon = True
            scraper_thread.start()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'started'}).encode())
            return

        # Stop scraping endpoint
        elif parsed_url.path == '/stop':
            global is_scraping

            if not is_scraping:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'No scraping in progress'}).encode())
                return

            # Stop scraping
            is_scraping = False
            log("Stopping scraping process...")

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'stopped'}).encode())
            return

        # View results endpoint
        elif parsed_url.path.startswith('/view'):
            # Parse query parameters
            query = urllib.parse.parse_qs(parsed_url.query)

            # Get output directory
            dir_path = query.get('dir', [OUTPUT_DIR])[0]

            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            # Check if directory exists
            if not os.path.exists(dir_path):
                self.wfile.write(f"<h1>Directory not found: {dir_path}</h1>".encode())
                return

            # List files in directory
            try:
                files = os.listdir(dir_path)
                files.sort()

                html = f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Files in {dir_path}</title>
                    <style>
                        /* Import 8-bit font */
                        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

                        body {{
                            font-family: 'Press Start 2P', cursive;
                            padding: 20px;
                            background-color: #000;
                            color: #fff;
                            image-rendering: pixelated;
                            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQImWNgYGD4z0AswK4SAFXuAf8EPy+xAAAAAElFTkSuQmCC');
                            background-repeat: repeat;
                        }}
                        h1 {{
                            color: #f96302;
                            text-shadow: 2px 2px 0 #000;
                            text-transform: uppercase;
                            font-size: 1.5rem;
                        }}
                        ul {{
                            list-style-type: none;
                            padding: 0;
                            border: 4px solid #f96302;
                            background-color: #000;
                        }}
                        li {{
                            margin: 0;
                            padding: 10px;
                            border-bottom: 4px solid #f96302;
                        }}
                        li:last-child {{
                            border-bottom: none;
                        }}
                        a {{
                            text-decoration: none;
                            color: #f96302;
                            display: block;
                            padding: 5px;
                        }}
                        a:hover {{
                            background-color: #f96302;
                            color: #000;
                        }}
                    </style>
                </head>
                <body>
                    <h1>HOME DEPOT FILES</h1>
                    <ul>
                """

                for file in files:
                    file_path = os.path.join(dir_path, file)
                    file_size = os.path.getsize(file_path)

                    # Format file size
                    if file_size < 1024:
                        size_str = f"{file_size} B"
                    elif file_size < 1024 * 1024:
                        size_str = f"{file_size / 1024:.1f} KB"
                    else:
                        size_str = f"{file_size / (1024 * 1024):.1f} MB"

                    html += f'<li><a href="/download?file={urllib.parse.quote(file_path)}">{file}</a> ({size_str})</li>'

                html += """
                    </ul>
                </body>
                </html>
                """

                self.wfile.write(html.encode())

            except Exception as e:
                self.wfile.write(f"<h1>Error: {str(e)}</h1>".encode())

            return

        # Download file endpoint
        elif parsed_url.path.startswith('/download'):
            # Parse query parameters
            query = urllib.parse.parse_qs(parsed_url.query)

            # Get file path
            file_path = query.get('file', [''])[0]

            # Check if file exists
            if not os.path.isfile(file_path):
                self.send_response(404)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(f"<h1>File not found: {file_path}</h1>".encode())
                return

            # Serve the file
            try:
                with open(file_path, 'rb') as f:
                    self.send_response(200)

                    # Determine content type
                    if file_path.endswith('.json'):
                        self.send_header('Content-type', 'application/json')
                    else:
                        self.send_header('Content-type', 'application/octet-stream')

                    # Set content disposition to download
                    file_name = os.path.basename(file_path)
                    self.send_header('Content-Disposition', f'attachment; filename="{file_name}"')

                    # Get file size
                    fs = os.fstat(f.fileno())
                    self.send_header("Content-Length", str(fs.st_size))
                    self.end_headers()

                    # Send the file content
                    self.wfile.write(f.read())

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(f"<h1>Error: {str(e)}</h1>".encode())

            return

        # Default: serve static files
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)


def main():
    global OUTPUT_DIR, API_KEY

    # Create output directory if it doesn't exist
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Start HTTP server
    port = 8000
    handler = ScraperHandler

    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Web interface started at http://localhost:{port}")
        print(f"Press Ctrl+C to stop the server")

        # Open browser automatically
        webbrowser.open(f"http://localhost:{port}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()


if __name__ == "__main__":
    main()
