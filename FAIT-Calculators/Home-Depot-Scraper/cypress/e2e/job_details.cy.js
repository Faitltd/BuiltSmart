describe('Job Details Page', () => {
  // This test assumes there's at least one job in the system
  // We'll need to create a job first or mock the API response

  it('should show job details when a job exists', () => {
    // First, we'll create a job by submitting the form
    cy.visit('/')

    // Fill out the form with minimal required data
    cy.get('#output-dir').clear().type('data')
    cy.get('#search-type').select('url_list')
    cy.get('#urls').type('https://www.homedepot.com/p/OSB-7-16-Application-as-4ft-X-8-ft-Sheathing-Panel-386081/202106230')

    // Intercept the API call to start the job
    cy.intercept('POST', '/api/start_job').as('startJob')

    // Submit the form
    cy.get('button[type="submit"]').click()

    // Wait for the API call to complete
    cy.wait('@startJob').then((interception) => {
      // Check if the API call was successful
      expect(interception.response.statusCode).to.eq(200)

      // Get the job ID from the response
      const jobId = interception.response.body.job_id

      // Visit the job details page
      cy.visit(`/job/${jobId}`)

      // Check if the job details are displayed
      cy.get('.card-header h2').should('contain', `Job #${jobId} Details`)

      // Check if the job status is displayed
      cy.get('.badge').should('exist')

      // Check if the progress bars are displayed
      cy.get('.progress').should('have.length', 2)

      // Check if the configuration section is displayed
      cy.get('h4').contains('Configuration').should('exist')

      // Check if the log messages section is displayed
      cy.get('h3').contains('Log Messages').should('exist')

      // If the job is running, check if the control buttons are displayed
      cy.get('body').then(($body) => {
        if ($body.find('#stop-scraping').length > 0) {
          cy.get('#stop-scraping').should('be.visible')
          cy.get('#end-now').should('be.visible')
          cy.get('#cancel-job').should('be.visible')
        }
      })
    })
  })

  it('should handle non-existent job gracefully', () => {
    // Visit a job details page with a non-existent job ID
    cy.visit('/job/999999', { failOnStatusCode: false })

    // Check if an error message is displayed
    cy.get('body').should('contain', 'not found')
  })
})
