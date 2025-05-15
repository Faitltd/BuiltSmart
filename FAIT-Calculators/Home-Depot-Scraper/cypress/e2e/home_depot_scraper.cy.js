describe('Home Depot Scraper Application', () => {
  beforeEach(() => {
    // Visit the main page before each test
    cy.visit('/');
  });

  it('should load the combined page correctly', () => {
    // Check if the page title is correct
    cy.title().should('include', 'Home Depot Scraper');
    
    // Check if the main components are visible
    cy.contains('h1', 'Home Depot Product Data Extractor').should('be.visible');
    cy.contains('Create New Job').should('be.visible');
    cy.contains('Recent Jobs').should('be.visible');
  });

  it('should validate the output directory', () => {
    // Open the new job form
    cy.contains('Create New Job').click();
    
    // Enter a directory and validate it
    cy.get('#output_dir').clear().type('data/test_output');
    cy.get('#validate_dir_btn').click();
    
    // Check if validation message appears
    cy.contains('Files will be saved to:').should('be.visible');
  });

  it('should show search term form when search term option is selected', () => {
    // Select search term option
    cy.get('#search_type').select('search_term');
    
    // Check if search term input is visible
    cy.get('#search_terms_container').should('be.visible');
    
    // Add a search term
    cy.get('#search_term_input').type('building materials{enter}');
    
    // Check if the term was added to the list
    cy.contains('building materials').should('be.visible');
  });

  it('should show category form when category option is selected', () => {
    // Select category option
    cy.get('#search_type').select('category');
    
    // Check if category input is visible
    cy.get('#category_container').should('be.visible');
    
    // Select a category
    cy.get('#category_id').select('Building Materials');
  });

  it('should show URL list form when URL list option is selected', () => {
    // Select URL list option
    cy.get('#search_type').select('url_list');
    
    // Check if URL list input is visible
    cy.get('#urls_container').should('be.visible');
    
    // Add a URL
    cy.get('#url_input').type('https://www.homedepot.com/p/123456{enter}');
    
    // Check if the URL was added to the list
    cy.contains('https://www.homedepot.com/p/123456').should('be.visible');
  });

  it('should allow customizing CSV headers', () => {
    // Open CSV headers section
    cy.contains('Customize CSV Headers').click();
    
    // Check if the CSV headers form is visible
    cy.get('#csv_headers_container').should('be.visible');
    
    // Modify a header
    cy.get('input[name="product_name"]').clear().type('Item Name');
    
    // Check if the header was updated
    cy.get('input[name="product_name"]').should('have.value', 'Item Name');
  });

  it('should submit a new job', () => {
    // Set up a job
    cy.get('#search_type').select('search_term');
    cy.get('#search_term_input').type('building materials{enter}');
    cy.get('#max_pages').clear().type('1');
    cy.get('#max_products').clear().type('5');
    cy.get('#output_dir').clear().type('data/test_output');
    
    // Submit the job
    cy.intercept('POST', '/api/start_job').as('startJob');
    cy.get('#submit_job').click();
    
    // Wait for the job to be submitted
    cy.wait('@startJob').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('job_id');
    });
    
    // Check if we're redirected to the job details page
    cy.url().should('include', '/job/');
  });
});
