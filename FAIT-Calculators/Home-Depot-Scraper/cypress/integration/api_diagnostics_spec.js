/// <reference types="cypress" />

describe('API Diagnostics Page', () => {
  beforeEach(() => {
    // Visit the API diagnostics page before each test
    cy.visit('/api/diagnostics');
  });

  it('should display the API diagnostics page correctly', () => {
    // Check that the page title is correct
    cy.title().should('eq', 'BigBox API Diagnostics');
    
    // Check that the main components are visible
    cy.contains('h1', 'BigBox API Diagnostics').should('be.visible');
    cy.contains('.card-header', 'API Connection Test').should('be.visible');
    cy.contains('.card-header', 'Troubleshooting Guide').should('be.visible');
    
    // Check that the form elements are present
    cy.get('#api-key').should('be.visible');
    cy.get('#search-term').should('be.visible').should('have.value', 'pipe');
    cy.get('#update-env').should('be.visible').should('not.be.checked');
    cy.get('#test-button').should('be.visible').contains('Test API Connection');
  });

  it('should show loading state when testing API connection', () => {
    // Intercept the API request but don't respond immediately
    cy.intercept('POST', '/api/test', (req) => {
      // Delay the response to show loading state
      req.reply({ delay: 1000, fixture: 'api_test_success.json' });
    }).as('apiTest');
    
    // Submit the form
    cy.get('#test-button').click();
    
    // Check that the button shows loading state
    cy.get('#test-button').should('be.disabled');
    cy.get('#test-button .spinner-border').should('be.visible');
    cy.get('#test-button').contains('Testing...');
    
    // Wait for the API request to complete
    cy.wait('@apiTest');
    
    // Check that the button returns to normal state
    cy.get('#test-button').should('not.be.disabled');
    cy.get('#test-button').contains('Test API Connection');
  });

  it('should display success message when API test is successful', () => {
    // Mock a successful API response
    cy.intercept('POST', '/api/test', { fixture: 'api_test_success.json' }).as('apiTest');
    
    // Submit the form
    cy.get('#test-button').click();
    
    // Wait for the API request to complete
    cy.wait('@apiTest');
    
    // Check that the results are displayed correctly
    cy.get('#test-results').should('be.visible');
    cy.get('#result-message').should('have.class', 'result-success');
    cy.get('#result-message').contains('Success!');
    
    // Check that the details table has the correct information
    cy.get('#details-table').contains('Status Code').siblings().contains('200');
    cy.get('#details-table').contains('API Success').siblings().contains('Yes');
    cy.get('#details-table').contains('Credits Remaining').siblings().contains('950');
    cy.get('#details-table').contains('Products Found').siblings().contains('25');
    
    // Check that the sample product is displayed
    cy.get('#sample-product-section').should('be.visible');
    cy.get('#sample-product-table').contains('Title').siblings().contains('Sample Product');
    
    // Check that the raw response is displayed
    cy.get('#raw-response-section').should('be.visible');
  });

  it('should display error message when API test fails', () => {
    // Mock a failed API response
    cy.intercept('POST', '/api/test', { fixture: 'api_test_error.json' }).as('apiTest');
    
    // Submit the form
    cy.get('#test-button').click();
    
    // Wait for the API request to complete
    cy.wait('@apiTest');
    
    // Check that the results are displayed correctly
    cy.get('#test-results').should('be.visible');
    cy.get('#result-message').should('have.class', 'result-error');
    cy.get('#result-message').contains('Error:');
    
    // Check that the details table has the correct information
    cy.get('#details-table').contains('Status Code').siblings().contains('401');
    cy.get('#details-table').contains('API Success').siblings().contains('No');
    
    // Check that the sample product is not displayed
    cy.get('#sample-product-section').should('not.be.visible');
  });

  it('should display warning message when API returns warning', () => {
    // Mock an API response with a warning
    cy.intercept('POST', '/api/test', { fixture: 'api_test_warning.json' }).as('apiTest');
    
    // Submit the form
    cy.get('#test-button').click();
    
    // Wait for the API request to complete
    cy.wait('@apiTest');
    
    // Check that the results are displayed correctly
    cy.get('#test-results').should('be.visible');
    cy.get('#result-message').should('have.class', 'result-warning');
    cy.get('#result-message').contains('Warning:');
  });

  it('should update environment API key when checkbox is checked', () => {
    // Mock a successful API response with env_updated flag
    cy.intercept('POST', '/api/test', (req) => {
      // Check if the update_env parameter is set to true
      const formData = req.body;
      expect(formData.get('update_env')).to.equal('true');
      
      req.reply({ fixture: 'api_test_env_updated.json' });
    }).as('apiTest');
    
    // Check the update environment checkbox
    cy.get('#update-env').check();
    
    // Submit the form
    cy.get('#test-button').click();
    
    // Wait for the API request to complete
    cy.wait('@apiTest');
    
    // Check that the success message includes the environment update note
    cy.get('#result-message').contains('Environment API key has been updated');
  });

  it('should display the API diagnostics form', () => {
    cy.get('#apiTestForm').should('be.visible');
    cy.get('#apiKey').should('be.visible');
    cy.get('#searchTerm').should('be.visible');
    cy.get('#testButton').should('be.visible');
  });

  it('should show an alert when submitting without an API key', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);
    
    cy.get('#testButton').click()
      .then(() => {
        expect(stub.getCall(0)).to.be.calledWith('Please enter an API key');
      });
  });

  it('should toggle API key visibility', () => {
    // API key should be hidden by default
    cy.get('#apiKey').should('have.attr', 'type', 'password');
    
    // Click the toggle button
    cy.get('#toggleApiKey').click();
    
    // API key should now be visible
    cy.get('#apiKey').should('have.attr', 'type', 'text');
    
    // Click the toggle button again
    cy.get('#toggleApiKey').click();
    
    // API key should be hidden again
    cy.get('#apiKey').should('have.attr', 'type', 'password');
  });

  // This test requires mocking the API response
  it('should display results when API test is successful', () => {
    // Mock the API response
    cy.intercept('POST', '/api/test', {
      statusCode: 200,
      body: {
        status_code: 200,
        success: true,
        api_success: true,
        message: 'Request successful',
        credits_remaining: 100,
        product_count: 5,
        sample_product: {
          title: 'Test Product',
          price: '$19.99',
          sku: '123456',
          model_number: 'TEST-123',
          link: 'https://www.homedepot.com/p/123456'
        },
        raw_response: '{"request_info":{"success":true,"message":"Request successful","credits_remaining":100},"search_results":[{"product":{"title":"Test Product","price":"$19.99","sku":"123456","model_number":"TEST-123","link":"https://www.homedepot.com/p/123456"}}]}'
      }
    }).as('apiTest');

    // Enter API key and submit form
    cy.get('#apiKey').type('test-api-key');
    cy.get('#testButton').click();

    // Wait for API request to complete
    cy.wait('@apiTest');

    // Results should be displayed
    cy.get('#resultsCard').should('be.visible');
    cy.get('#connectionStatus').should('have.class', 'status-success');
    cy.get('#authStatus').should('have.class', 'status-success');
    cy.get('#creditsStatus').should('have.class', 'status-success');
    cy.get('#resultsStatus').should('have.class', 'status-success');
    
    // Sample product should be displayed
    cy.get('#sampleProduct').should('be.visible');
    cy.get('#productTitle').should('contain', 'Test Product');
    cy.get('#productPrice').should('contain', '$19.99');
  });
});
