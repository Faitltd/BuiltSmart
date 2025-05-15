describe('Dashboard Tests', () => {
  beforeEach(() => {
    // Visit the dashboard page before each test
    cy.visit('/dashboard');
  });

  it('should load the dashboard correctly', () => {
    // Check if the page title is correct
    cy.title().should('include', 'Dashboard');
    
    // Check if the main components are visible
    cy.contains('h1', 'Scraper Dashboard').should('be.visible');
    cy.get('.stats-card').should('have.length.at.least', 3);
  });

  it('should display recent jobs', () => {
    // Check if recent jobs section is visible
    cy.contains('h2', 'Recent Jobs').should('be.visible');
    
    // Check if there are jobs listed
    cy.get('.job-list-item').should('have.length.at.least', 1);
  });

  it('should display statistics', () => {
    // Check if statistics cards are visible
    cy.get('.stats-card').each(($card) => {
      // Each card should have a title and a value
      cy.wrap($card).find('.stats-title').should('be.visible');
      cy.wrap($card).find('.stats-value').should('be.visible');
    });
  });

  it('should navigate to job details from dashboard', () => {
    // Click on the first job in the list
    cy.get('.job-list-item').first().click();
    
    // Check if we're redirected to the job details page
    cy.url().should('include', '/job/');
  });

  it('should filter jobs by status', () => {
    // Check if filter controls are visible
    cy.get('#status-filter').should('be.visible');
    
    // Filter by completed status
    cy.get('#status-filter').select('COMPLETED');
    
    // Check if jobs are filtered
    cy.get('.job-list-item').each(($item) => {
      cy.wrap($item).find('.badge').should('contain', 'COMPLETED');
    });
    
    // Filter by running status
    cy.get('#status-filter').select('RUNNING');
    
    // Check if jobs are filtered
    cy.get('.job-list-item').each(($item) => {
      cy.wrap($item).find('.badge').should('contain', 'RUNNING');
    });
  });

  it('should display charts with data', () => {
    // Check if charts are visible
    cy.get('#jobs-chart').should('be.visible');
    cy.get('#products-chart').should('be.visible');
  });
});
