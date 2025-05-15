describe('Lowes Scraper Application', () => {
  beforeEach(() => {
    // Visit the Lowes page before each test
    cy.visit('/lowes');
  });

  it('should load the Lowes page correctly', () => {
    // Check if the page title is correct
    cy.title().should('include', 'Lowes Scraper');
    
    // Check if the main components are visible
    cy.contains('h1', 'Lowes Product Data Extractor').should('be.visible');
    cy.contains('Create New Job').should('be.visible');
    cy.contains('Recent Jobs').should('be.visible');
  });

  it('should navigate to the jobs page', () => {
    // Click on the jobs link
    cy.contains('a', 'View All Jobs').click();
    
    // Check if we're on the jobs page
    cy.url().should('include', '/lowes/jobs');
    cy.contains('h2', 'Lowes Scraper Jobs').should('be.visible');
  });

  it('should create a new search term job', () => {
    // Click on create new job
    cy.contains('a', 'Create New Job').click();
    
    // Fill out the form
    cy.get('#search_type').select('search_term');
    cy.get('#search_term').type('building materials');
    cy.get('#max_pages').clear().type('1');
    cy.get('#max_products').clear().type('5');
    cy.get('#output_format').select('csv');
    
    // Submit the form
    cy.intercept('POST', '/lowes/api/create_job').as('createJob');
    cy.get('button[type="submit"]').click();
    
    // Wait for the job to be created
    cy.wait('@createJob').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('job_id');
    });
    
    // Check if we're redirected to the job details page
    cy.url().should('include', '/lowes/job/');
  });

  it('should create a new category job', () => {
    // Click on create new job
    cy.contains('a', 'Create New Job').click();
    
    // Fill out the form
    cy.get('#search_type').select('category');
    cy.get('#category').select('Building Materials');
    cy.get('#max_pages').clear().type('1');
    cy.get('#max_products').clear().type('5');
    cy.get('#output_format').select('csv');
    
    // Submit the form
    cy.intercept('POST', '/lowes/api/create_job').as('createJob');
    cy.get('button[type="submit"]').click();
    
    // Wait for the job to be created
    cy.wait('@createJob').then((interception) => {
      expect(interception.response.statusCode).to.equal(200);
      expect(interception.response.body).to.have.property('job_id');
    });
    
    // Check if we're redirected to the job details page
    cy.url().should('include', '/lowes/job/');
  });

  it('should stop a running job', () => {
    // Create a new job first
    cy.contains('a', 'Create New Job').click();
    cy.get('#search_type').select('search_term');
    cy.get('#search_term').type('building materials');
    cy.get('#max_pages').clear().type('2');
    cy.get('#max_products').clear().type('10');
    cy.get('#output_format').select('csv');
    
    // Submit the form
    cy.intercept('POST', '/lowes/api/create_job').as('createJob');
    cy.get('button[type="submit"]').click();
    
    // Wait for the job to be created and get the job ID
    cy.wait('@createJob').then((interception) => {
      const jobId = interception.response.body.job_id;
      
      // Wait a moment for the job to start
      cy.wait(2000);
      
      // Click the stop button if the job is running
      cy.get('#stop-job').click();
      
      // Intercept the stop job request
      cy.intercept('POST', `/lowes/api/stop_job/${jobId}`).as('stopJob');
      
      // Confirm the stop
      cy.contains('button', 'Yes, Stop Job').click();
      
      // Wait for the stop request to complete
      cy.wait('@stopJob');
      
      // Check if the job status is updated
      cy.contains('span.badge', 'STOPPED').should('be.visible');
    });
  });

  it('should download job results', () => {
    // Go to the jobs page
    cy.visit('/lowes/jobs');
    
    // Find a completed job
    cy.contains('tr', 'COMPLETED').within(() => {
      // Click on the job details link
      cy.get('a').first().click();
    });
    
    // Check if we're on the job details page
    cy.url().should('include', '/lowes/job/');
    
    // Click the download button
    cy.contains('a', 'DOWNLOAD').should('be.visible').click();
    
    // We can't directly test file downloads in Cypress,
    // but we can check if the download link has the correct href
    cy.contains('a', 'DOWNLOAD').should('have.attr', 'href')
      .and('include', '/lowes/api/download/');
  });
});