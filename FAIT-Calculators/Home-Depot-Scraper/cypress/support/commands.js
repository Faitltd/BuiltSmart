// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Custom command to wait for API key validation
Cypress.Commands.add('waitForApiValidation', () => {
  cy.get('#api_status', { timeout: 10000 }).should('not.contain', 'Validating...');
});

// Custom command to add multiple search terms
Cypress.Commands.add('addSearchTerms', (terms) => {
  terms.forEach(term => {
    cy.get('#search_term_input').type(`${term}{enter}`);
  });
});

// Custom command to add multiple URLs
Cypress.Commands.add('addUrls', (urls) => {
  urls.forEach(url => {
    cy.get('#url_input').type(`${url}{enter}`);
  });
});

// Custom command to check job status
Cypress.Commands.add('checkJobStatus', (jobId) => {
  cy.visit(`/job/${jobId}`);
  return cy.get('.badge').invoke('text').then((text) => {
    return text.trim();
  });
});

// Custom command to wait for job completion
Cypress.Commands.add('waitForJobCompletion', (jobId, timeout = 60000) => {
  const checkInterval = 5000; // Check every 5 seconds
  const maxAttempts = timeout / checkInterval;
  let attempts = 0;
  
  function checkStatus() {
    return cy.checkJobStatus(jobId).then((status) => {
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'STOPPED') {
        return status;
      }
      
      attempts++;
      if (attempts >= maxAttempts) {
        throw new Error(`Job ${jobId} did not complete within the timeout period`);
      }
      
      cy.wait(checkInterval);
      return checkStatus();
    });
  }
  
  return checkStatus();
});

// Custom command to download job results
Cypress.Commands.add('downloadJobResults', (jobId) => {
  return cy.request({
    url: `/api/download/${jobId}`,
    method: 'GET',
    encoding: 'binary'
  }).then((response) => {
    // Return the response body (file content)
    return response.body;
  });
});

// Custom command to validate CSV content
Cypress.Commands.add('validateCsvContent', (csvContent) => {
  // Split the CSV content into lines
  const lines = csvContent.split('\n');
  
  // Check if there are at least 2 lines (header + at least one data row)
  expect(lines.length).to.be.at.least(2);
  
  // Check if the header contains expected columns
  const header = lines[0];
  expect(header).to.include('Product Name');
  expect(header).to.include('SKU');
  expect(header).to.include('URL');
  
  // Check if at least one data row has content
  const dataRow = lines[1];
  expect(dataRow.length).to.be.greaterThan(0);
  
  return csvContent;
});
