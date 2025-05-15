#!/usr/bin/env python3
"""
Simple web interface to display scraping progress and provide a stop button.
"""

import os
import json
import threading
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Import the scraper module to access the progress data
import scrape_specific_products as scraper

# HTML template for the progress page
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home Depot Scraper Progress</title>
    <style>
        /* Import 8-bit font */
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        body {
            font-family: 'Press Start 2P', cursive;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #000;
            color: #fff;
            image-rendering: pixelated;
            background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEklEQVQImWNgYGD4z0AswK4SAFXuAf8EPy+xAAAAAElFTkSuQmCC');
            background-repeat: repeat;
        }
        .card {
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
        }
        h1 {
            color: #f96302; /* Home Depot Orange */
            text-shadow: 2px 2px 0 #000;
            text-transform: uppercase;
            font-size: 1.5rem;
            margin-bottom: 20px;
        }
        h3 {
            color: #f96302; /* Home Depot Orange */
            font-size: 1rem;
        }
        .progress-container {
            margin: 20px 0;
        }
        .progress-bar {
            height: 20px;
            background-color: #000;
            border: 4px solid #f96302; /* Home Depot Orange */
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background-color: #f96302; /* Home Depot Orange */
            transition: width 0.3s ease;
        }
        .status {
            margin-top: 10px;
            font-size: 0.7rem;
            line-height: 1.5;
        }
        .buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        .btn {
            padding: 15px 20px;
            background-color: #f96302; /* Home Depot Orange */
            color: #fff;
            border: 4px solid #000;
            cursor: pointer;
            font-family: 'Press Start 2P', cursive;
            text-transform: uppercase;
            font-size: 0.8rem;
            box-shadow: 4px 4px 0 #000;
            transition: all 0.1s ease;
        }
        .btn:hover {
            transform: translate(2px, 2px);
            box-shadow: 2px 2px 0 #000;
        }
        .btn-stop {
            background-color: #f96302; /* Home Depot Orange */
        }
        .btn-download {
            background-color: #f96302; /* Home Depot Orange */
        }
        .btn-disabled {
            background-color: #666;
            cursor: not-allowed;
            opacity: 0.5;
        }
        .btn-disabled:hover {
            transform: none;
            box-shadow: 4px 4px 0 #000;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 10px;
            font-size: 0.7rem;
            font-weight: bold;
            color: #000;
            border: 2px solid #000;
            margin-right: 10px;
        }
        .status-running {
            background-color: #f96302; /* Home Depot Orange */
        }
        .status-stopping {
            background-color: #f96302; /* Home Depot Orange */
            animation: blink 1s infinite;
        }
        .status-completed {
            background-color: #f96302; /* Home Depot Orange */
        }
        .status-error {
            background-color: #f96302; /* Home Depot Orange */
        }
        .status-idle {
            background-color: #f96302; /* Home Depot Orange */
        }
        .last-saved {
            margin-top: 15px;
            font-size: 0.7rem;
            color: #f96302; /* Home Depot Orange */
            border-top: 2px dashed #f96302;
            padding-top: 10px;
        }
        /* Blinking animation */
        @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>HOME DEPOT SCRAPER</h1>

        <div class="progress-container">
            <h3>PROGRESS: <span id="progress-percent">0%</span></h3>
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            <div class="status">
                <span class="status-badge status-{status}" id="status-badge">{status}</span>
                <span id="progress-text">{current} of {total} items processed</span>
            </div>
            <div class="status" id="message">{message}</div>

            {last_saved_html}
        </div>

        <div class="buttons">
            <button class="btn btn-stop" id="stop-btn" onclick="stopScraping()" {stop_disabled}>STOP & SAVE</button>
            <button class="btn btn-download" id="download-btn" onclick="downloadResults()" {download_disabled}>DOWNLOAD</button>
        </div>
    </div>

    <script>
        // Auto-refresh the progress data
        setInterval(function() {
            fetch('/progress')
                .then(response => response.json())
                .then(data => updateProgress(data));
        }, 1000);

        function updateProgress(data) {
            // Update progress bar
            const percent = data.percentage;
            document.getElementById('progress-percent').textContent = percent + '%';
            document.getElementById('progress-fill').style.width = percent + '%';

            // Update status text
            document.getElementById('progress-text').textContent =
                data.current + ' of ' + data.total + ' items processed';

            // Update message
            document.getElementById('message').textContent = data.message;

            // Update status badge
            const statusBadge = document.getElementById('status-badge');
            statusBadge.textContent = data.status;
            statusBadge.className = 'status-badge status-' + data.status;

            // Update buttons based on status
            const stopBtn = document.getElementById('stop-btn');
            const downloadBtn = document.getElementById('download-btn');

            if (data.status === 'running') {
                stopBtn.disabled = false;
                stopBtn.classList.remove('btn-disabled');
            } else {
                stopBtn.disabled = true;
                stopBtn.classList.add('btn-disabled');
            }

            if (data.last_saved) {
                downloadBtn.disabled = false;
                downloadBtn.classList.remove('btn-disabled');

                // Update last saved info
                const lastSavedDiv = document.getElementById('last-saved');
                if (lastSavedDiv) {
                    lastSavedDiv.innerHTML = 'LAST SAVED: ' +
                        data.last_saved.count + ' PRODUCTS TO ' +
                        data.last_saved.file;
                }
            } else {
                downloadBtn.disabled = true;
                downloadBtn.classList.add('btn-disabled');
            }
        }

        function stopScraping() {
            fetch('/stop', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('STOPPING SCRAPER AND SAVING CURRENT RESULTS...');
                    } else {
                        alert('ERROR: ' + data.message);
                    }
                });
        }

        function downloadResults() {
            window.location.href = '/download';
        }
    </script>
</body>
</html>
"""

class ProgressHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the progress UI."""

    def do_GET(self):
        """Handle GET requests."""
        parsed_url = urlparse(self.path)

        # Serve the main page
        if parsed_url.path == '/' or parsed_url.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            # Get current progress
            with scraper.progress_lock:
                progress_data = scraper.current_progress.copy()

            # Prepare last saved HTML
            last_saved_html = ""
            if progress_data.get('last_saved'):
                last_saved = progress_data['last_saved']
                last_saved_html = f"""
                <div class="last-saved" id="last-saved">
                    LAST SAVED: {last_saved['count']} PRODUCTS TO {last_saved['file']}
                </div>
                """

            # Prepare button states
            stop_disabled = "" if progress_data['status'] == 'running' else "disabled"
            download_disabled = "" if progress_data.get('last_saved') else "disabled"

            # Render the HTML template
            html = HTML_TEMPLATE.format(
                current=progress_data['current'],
                total=progress_data['total'],
                percentage=progress_data['percentage'],
                status=progress_data['status'],
                message=progress_data['message'],
                last_saved_html=last_saved_html,
                stop_disabled=stop_disabled,
                download_disabled=download_disabled
            )

            self.wfile.write(html.encode())
            return

        # Serve progress data as JSON
        elif parsed_url.path == '/progress':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            # Get current progress
            with scraper.progress_lock:
                progress_data = scraper.current_progress.copy()

            self.wfile.write(json.dumps(progress_data).encode())
            return

        # Serve download file
        elif parsed_url.path == '/download':
            with scraper.progress_lock:
                last_saved = scraper.current_progress.get('last_saved')

            if not last_saved or not last_saved.get('path') or not os.path.exists(last_saved['path']):
                self.send_response(404)
                self.send_header('Content-type', 'text/plain')
                self.end_headers()
                self.wfile.write(b'No saved results available')
                return

            # Serve the file
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.send_header('Content-Disposition', f'attachment; filename="{last_saved["file"]}"')
            self.end_headers()

            with open(last_saved['path'], 'rb') as f:
                self.wfile.write(f.read())
            return

        # Not found
        self.send_response(404)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Not found')

    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/stop':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            # Request to stop the scraper
            if scraper.is_scraping and not scraper.stop_requested:
                scraper.request_stop(confirm=False)
                self.wfile.write(json.dumps({'success': True}).encode())
            else:
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Scraper is not running or already stopping'
                }).encode())
            return

        # Not found
        self.send_response(404)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Not found')

def start_progress_ui(port=8000):
    """Start the progress UI web server.

    Args:
        port: Port to listen on
    """
    server = HTTPServer(('localhost', port), ProgressHandler)
    print(f"Progress UI started at http://localhost:{port}")

    # Open browser
    webbrowser.open(f"http://localhost:{port}")

    # Run server in a thread
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()

    return server

if __name__ == "__main__":
    # This allows running the UI standalone for testing
    server = start_progress_ui()
    try:
        # Simulate progress updates
        import time
        for i in range(101):
            with scraper.progress_lock:
                scraper.current_progress['current'] = i
                scraper.current_progress['total'] = 100
                scraper.current_progress['percentage'] = i
                scraper.current_progress['message'] = f"Processing item {i}"
                scraper.current_progress['status'] = 'running'
                if i == 50:
                    scraper.current_progress['last_saved'] = {
                        'file': 'test_results.csv',
                        'path': 'test_results.csv',
                        'count': i,
                        'time': '20250429_000000'
                    }
            time.sleep(0.1)

        # Mark as completed
        with scraper.progress_lock:
            scraper.current_progress['status'] = 'completed'
            scraper.current_progress['message'] = "Scraping completed"

        # Keep server running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Shutting down server...")
        server.shutdown()
