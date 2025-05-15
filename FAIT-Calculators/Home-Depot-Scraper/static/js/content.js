/**
 * Lowe's Scraper Content JavaScript
 *
 * This file contains JavaScript functions for the Lowe's Scraper UI.
 */

// Global variables
let jobRefreshInterval = null;
let logRefreshInterval = null;

// Function to format timestamps
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Function to update progress bar
function updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        progressBar.textContent = `${percentage}%`;
    }
}

// Function to update status message
function updateStatusMessage(message) {
    const statusLine = document.querySelector('.status-line');
    if (statusLine) {
        statusLine.textContent = message;
    }
}

// Function to add log message
function addLogMessage(message) {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        const logLine = document.createElement('div');
        logLine.className = 'log-message';
        logLine.textContent = message;
        logContainer.appendChild(logLine);

        // Scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
}

// Function to add detailed log message
function addDetailedLogMessage(message) {
    const detailedLogContainer = document.getElementById('detailed-live-log');
    if (detailedLogContainer) {
        const logLine = document.createElement('div');
        logLine.className = 'detailed-log-line';
        logLine.textContent = message;
        detailedLogContainer.appendChild(logLine);

        // Scroll to bottom
        detailedLogContainer.scrollTop = detailedLogContainer.scrollHeight;
    }
}

// Function to refresh job status
function refreshJobStatus(jobId) {
    fetch(`/lowes/api/job/${jobId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Update progress
            updateProgressBar(data.progress);

            // Update status message
            updateStatusMessage(data.status_message);

            // Update log messages
            const logContainer = document.getElementById('log-container');
            if (logContainer) {
                logContainer.innerHTML = '';
                data.log_messages.forEach(message => {
                    if (!message.includes('API key') && !message.includes('password') &&
                        !message.includes('secret') && !message.includes('token')) {
                        addLogMessage(message);
                    }
                });
            }

            // Update detailed log
            const detailedLogContainer = document.getElementById('detailed-live-log');
            if (detailedLogContainer) {
                detailedLogContainer.innerHTML = '';
                data.log_messages.forEach(message => {
                    addDetailedLogMessage(message);
                });
            }

            // If job is no longer running, reload the page to show download button
            if (data.status !== 'RUNNING' && jobRefreshInterval) {
                clearInterval(jobRefreshInterval);
                window.location.reload();
            }
        })
        .catch(error => {
            console.error('Error refreshing job status:', error);

            // If we get a 404 error (job not found), show an error message and redirect to jobs list
            if (error.message.includes('404')) {
                clearInterval(jobRefreshInterval);
                alert('Job not found. It may have been deleted or the server was restarted. Redirecting to jobs list.');
                window.location.href = '/lowes/jobs';
            }
        });
}

// Initialize job details page
function initJobDetailsPage(jobId) {
    // Set up refresh interval for running jobs
    const isRunning = document.querySelector('.badge.bg-primary') !== null;

    if (isRunning) {
        jobRefreshInterval = setInterval(() => {
            refreshJobStatus(jobId);
        }, 5000);
    }

    // Set up stop job button
    const stopJobButton = document.getElementById('stop-job');
    if (stopJobButton) {
        stopJobButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to stop this job? Partial results will be saved.')) {
                fetch(`/lowes/api/stop_job/${jobId}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.reload();
                    } else {
                        alert('Error stopping job: ' + data.error);
                    }
                })
                .catch(error => {
                    console.error('Error stopping job:', error);
                });
            }
        });
    }

    // Scroll to bottom of logs on page load
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    const detailedLogContainer = document.getElementById('detailed-live-log');
    if (detailedLogContainer) {
        detailedLogContainer.scrollTop = detailedLogContainer.scrollHeight;
    }
}

// Initialize jobs list page
function initJobsListPage() {
    // Auto-refresh the page every 10 seconds if there are running jobs
    const hasRunningJobs = document.querySelector('.status-running') !== null;

    if (hasRunningJobs) {
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }
}

// Initialize new job page
function initNewJobPage() {
    // Store the default headers
    const defaultHeadersElement = document.getElementById('default-headers-data');
    let defaultHeaders = {};

    if (defaultHeadersElement) {
        try {
            defaultHeaders = JSON.parse(defaultHeadersElement.textContent);
        } catch (e) {
            console.error('Error parsing default headers:', e);
        }
    }

    // Show/hide search type options based on selection
    function updateSearchTypeOptions() {
        const searchType = document.getElementById('search-type').value;
        const searchOptions = document.querySelectorAll('.search-options');

        searchOptions.forEach(option => {
            option.style.display = 'none';
        });

        if (searchType === 'category') {
            document.getElementById('category-options').style.display = 'block';
        } else if (searchType === 'search_term') {
            document.getElementById('search-term-options').style.display = 'block';
        } else if (searchType === 'url_list') {
            document.getElementById('url-list-options').style.display = 'block';
            // Set default max products to 1 for URL search
            document.getElementById('max-products').value = '1';
        }
    }

    // Initial update
    updateSearchTypeOptions();

    // Update on change
    const searchTypeSelect = document.getElementById('search-type');
    if (searchTypeSelect) {
        searchTypeSelect.addEventListener('change', updateSearchTypeOptions);
    }

    // Reset headers to default
    const resetHeadersButton = document.getElementById('reset-headers');
    if (resetHeadersButton) {
        resetHeadersButton.addEventListener('click', () => {
            for (const [field, header] of Object.entries(defaultHeaders)) {
                const input = document.querySelector(`input[name="csv_header_${field}"]`);
                if (input) {
                    input.value = header;
                }
            }
        });
    }

    // Form submission
    const scraperForm = document.getElementById('scraper-form');
    if (scraperForm) {
        scraperForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect form data
            const searchType = document.getElementById('search-type').value;
            const maxPages = document.getElementById('max-pages').value;
            const maxProducts = document.getElementById('max-products').value;
            const outputFormat = document.getElementById('output-format').value;

            // Collect search parameters based on search type
            let searchParams = {};
            if (searchType === 'category') {
                searchParams.category = document.getElementById('category').value;
            } else if (searchType === 'search_term') {
                const searchTerms = document.getElementById('search-terms').value
                    .split('\n')
                    .filter(term => term.trim() !== '');
                searchParams.search_terms = searchTerms;
            } else if (searchType === 'url_list') {
                const urls = document.getElementById('urls').value
                    .split('\n')
                    .filter(url => url.trim() !== '');
                searchParams.urls = urls;
            }

            // Collect custom CSV headers
            const csvHeaders = {};
            const csvHeaderInputs = document.querySelectorAll('.csv-header-input');
            csvHeaderInputs.forEach(input => {
                const field = input.dataset.field;
                const value = input.value;
                csvHeaders[field] = value;
            });

            // Create the request data
            const requestData = {
                search_type: searchType,
                max_pages: parseInt(maxPages),
                max_products: parseInt(maxProducts),
                output_format: outputFormat,
                csv_headers: csvHeaders,
                ...searchParams
            };

            // Submit the job
            fetch('/lowes/api/start_job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Redirect to job details page
                    window.location.href = `/lowes/job/${data.job_id}`;
                } else {
                    alert(`Error: ${data.error}`);
                }
            })
            .catch(error => {
                alert(`Error: ${error}`);
            });
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check which page we're on
    const jobDetailsPage = document.querySelector('.job-details-page');
    const jobsListPage = document.querySelector('.jobs-list-page');
    const newJobPage = document.querySelector('.new-job-page');

    if (jobDetailsPage) {
        const jobId = jobDetailsPage.dataset.jobId;
        initJobDetailsPage(jobId);
    } else if (jobsListPage) {
        initJobsListPage();
    } else if (newJobPage) {
        initNewJobPage();
    }
});
