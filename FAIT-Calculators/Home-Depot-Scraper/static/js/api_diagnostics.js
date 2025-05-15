/**
 * BigBox API Diagnostics JavaScript
 * 
 * This file contains the JavaScript functionality for the API diagnostics page,
 * including API testing, result display, and troubleshooting assistance.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const form = document.getElementById('api-test-form');
    const testButton = document.getElementById('test-button');
    const resultsDiv = document.getElementById('test-results');
    const resultMessage = document.getElementById('result-message');
    const detailsTable = document.getElementById('details-table');
    const sampleProductSection = document.getElementById('sample-product-section');
    const sampleProductTable = document.getElementById('sample-product-table');
    const rawResponseSection = document.getElementById('raw-response-section');
    const rawResponsePre = document.getElementById('raw-response');
    const apiKeyInput = document.getElementById('api-key');
    const searchTermInput = document.getElementById('search-term');
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    const detailsSection = document.getElementById('details-section');
    
    // Add Bootstrap icons if not already included
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
        const iconLink = document.createElement('link');
        iconLink.rel = 'stylesheet';
        iconLink.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css';
        document.head.appendChild(iconLink);
    }
    
    // Initialize tooltips if Bootstrap 5 is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Toggle API Key visibility
    toggleApiKeyBtn.addEventListener('click', function() {
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            toggleApiKeyBtn.innerHTML = '<i class="bi bi-eye-slash"></i> Hide';
        } else {
            apiKeyInput.type = 'password';
            toggleApiKeyBtn.innerHTML = '<i class="bi bi-eye"></i> Show';
        }
    });
    
    // API Test Form Submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading state
        testButton.disabled = true;
        testButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Testing...';
        
        // Hide previous results
        resultsDiv.style.display = 'none';
        
        // Get form values
        const apiKey = apiKeyInput.value.trim();
        const searchTerm = searchTermInput.value.trim() || 'pipe';
        
        // Make API request
        fetch('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                search_term: searchTerm
            })
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            testButton.disabled = false;
            testButton.innerHTML = 'Test API Connection';
            
            // Show results
            resultsDiv.style.display = 'block';
            
            // Clear previous results
            resultMessage.innerHTML = '';
            detailsTable.innerHTML = '';
            sampleProductTable.innerHTML = '';
            rawResponsePre.textContent = '';
            
            // Set result message
            if (data.success && data.api_success) {
                resultMessage.className = 'result-box result-success';
                resultMessage.innerHTML = `<i class="bi bi-check-circle-fill"></i> <strong>Success!</strong> API connection established successfully.`;
                
                if (data.warning) {
                    resultMessage.className = 'result-box result-warning';
                    resultMessage.innerHTML += `<br><i class="bi bi-exclamation-triangle-fill"></i> <strong>Warning:</strong> ${data.warning}`;
                }
            } else {
                resultMessage.className = 'result-box result-error';
                resultMessage.innerHTML = `<i class="bi bi-x-circle-fill"></i> <strong>Error:</strong> ${data.error || 'API connection failed'}`;
            }
            
            // Populate details table
            detailsSection.style.display = 'block';
            let detailsRows = [
                ['Status Code', data.status_code || 'N/A'],
                ['API Success', data.api_success ? 'Yes' : 'No'],
                ['Credits Remaining', data.credits_remaining || 'N/A'],
                ['Products Found', data.product_count || '0']
            ];
            
            if (data.message) {
                detailsRows.push(['API Message', data.message]);
            }
            
            detailsRows.forEach(row => {
                const tr = document.createElement('tr');
                const th = document.createElement('th');
                th.scope = 'row';
                th.textContent = row[0];
                const td = document.createElement('td');
                td.textContent = row[1];
                tr.appendChild(th);
                tr.appendChild(td);
                detailsTable.appendChild(tr);
            });
            
            // Show sample product if available
            if (data.sample_product) {
                sampleProductSection.style.display = 'block';
                const product = data.sample_product;
                const productRows = [
                    ['Title', product.title],
                    ['Price', product.price],
                    ['SKU', product.sku],
                    ['Model Number', product.model_number],
                    ['URL', `<a href="${product.link}" target="_blank">${product.link}</a>`]
                ];
                
                if (product.image) {
                    productRows.push(['Image', `<img src="${product.image}" alt="Product" style="max-width: 100px; max-height: 100px;">`]);
                }
                
                productRows.forEach(row => {
                    const tr = document.createElement('tr');
                    const th = document.createElement('th');
                    th.scope = 'row';
                    th.textContent = row[0];
                    const td = document.createElement('td');
                    td.innerHTML = row[1];
                    tr.appendChild(th);
                    tr.appendChild(td);
                    sampleProductTable.appendChild(tr);
                });
            } else {
                sampleProductSection.style.display = 'none';
            }
            
            // Show raw response
            if (data.raw_response) {
                rawResponseSection.style.display = 'block';
                rawResponsePre.textContent = data.raw_response;
            } else {
                rawResponseSection.style.display = 'none';
            }
        })
        .catch(error => {
            // Reset button state
            testButton.disabled = false;
            testButton.innerHTML = 'Test API Connection';
            
            // Show error
            resultsDiv.style.display = 'block';
            resultMessage.className = 'result-box result-error';
            resultMessage.innerHTML = `<i class="bi bi-x-circle-fill"></i> <strong>Error:</strong> ${error.message || 'An unexpected error occurred'}`;
            
            // Hide other sections
            detailsSection.style.display = 'none';
            sampleProductSection.style.display = 'none';
            rawResponseSection.style.display = 'none';
        });
    });
    
    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
    
    // Check for API key in URL parameters (for redirects from settings page)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('test') && urlParams.has('key')) {
        const key = urlParams.get('key');
        apiKeyInput.value = key;
        form.dispatchEvent(new Event('submit'));
    }
});
