describe('Jobs List Page', () => {
  beforeEach(() => {
    // Visit the jobs page before each test
    cy.visit('/jobs')
  })

  it('should load the jobs page', () => {
    // Check if the page title is correct
    cy.title().should('include', 'Home Depot Scraper')

    // Check if the page header is correct
    cy.get('.card-header h2').should('contain', 'Scraper Jobs')

    // Check if either the jobs table or the "no jobs" message exists
    cy.get('body').then(($body) => {
      if ($body.find('table').length > 0) {
        // Check if the table headers are correct
        cy.get('th').should('contain', 'Job ID')
        cy.get('th').should('contain', 'Search Type')
        cy.get('th').should('contain', 'Status')
        cy.get('th').should('contain', 'Start Time')
        cy.get('th').should('contain', 'Progress')
        cy.get('th').should('contain', 'Actions')
      } else {
        // Check if the "no jobs" message exists
        cy.get('.alert-info').should('contain', 'No jobs have been created yet')
      }
    })
  })

  it('should have a link to create a new job', () => {
    // Check if the link to create a new job exists
    cy.get('body').then(($body) => {
      if ($body.find('table').length > 0) {
        // If there are jobs, check for the link in the navbar
        cy.get('a[href="/"]').should('exist')
      } else {
        // If there are no jobs, check for the link in the alert
        cy.get('.alert-info a').should('contain', 'Create a new job')
        cy.get('.alert-info a').should('have.attr', 'href', '/')
      }
    })
  })

  it('should show job details when clicking on a job', () => {
    // This test assumes there's at least one job in the system
    // If there are no jobs, we'll skip this test
    cy.get('body').then(($body) => {
      if ($body.find('tr[data-job-id]').length > 0) {
        // Get the job ID of the first job
        cy.get('tr[data-job-id]').first().invoke('attr', 'data-job-id').then((jobId) => {
          // Click on the job
          cy.get(`tr[data-job-id="${jobId}"]`).click()

          // Check if we're redirected to the job details page
          cy.url().should('include', `/job/${jobId}`)
        })
      } else {
        // Skip this test if there are no jobs
        cy.log('No jobs found, skipping test')
      }
    })
  })
})
