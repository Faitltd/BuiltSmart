describe('Scraper Comparison Tests', () => {
  it('should compare search results between Home Depot and Lowes', () => {
    // Common search term to use for both scrapers
    const searchTerm = 'building materials';
    let homeDepotJobId, lowesJobId;
    
    // Create a Home Depot job
    cy.visit('/');
    cy.contains('Create New Job').click();
    cy.get('#search_type').select('search_term');
    cy.get('#search_term_input').type(`${searchTerm}{enter}`);
    cy.get('#max_pages').clear().type('1');
    cy.get('#max_products').clear().type('5');
    cy.get('#output_format').select('csv');
    
    // Submit the Home Depot job
    cy.intercept('POST', '/api/start_job').as('startHomeDepotJob');
    cy.get('#submit_job').click();
    
    // Wait for the job to be submitted and get the job ID
    cy.wait('@startHomeDepotJob').then((interception) => {
      homeDepotJobId = interception.response.body.job_id;
      
      // Now create a Lowes job with the same search term
      cy.visit('/lowes');
      cy.contains('Create New Job').click();
      cy.get('#search_type').select('search_term');
      cy.get('#search_term').type(searchTerm);
      cy.get('#max_pages').clear().type('1');
      cy.get('#max_products').clear().type('5');
      cy.get('#output_format').select('csv');
      
      // Submit the Lowes job
      cy.intercept('POST', '/lowes/api/create_job').as('startLowesJob');
      cy.get('button[type="submit"]').click();
      
      // Wait for the job to be submitted and get the job ID
      cy.wait('@startLowesJob').then((interception) => {
        lowesJobId = interception.response.body.job_id;
        
        // Wait for both jobs to complete (with a timeout)
        const waitForCompletion = (jobId, isLowes = false) => {
          const baseUrl = isLowes ? '/lowes' : '';
          return new Cypress.Promise((resolve, reject) => {
            const checkStatus = () => {
              cy.request(`${baseUrl}/api/job_status/${jobId}`).then(response => {
                if (response.body.status === 'COMPLETED' || response.body.status === 'FAILED') {
                  resolve(response.body);
                } else if (response.body.status === 'RUNNING') {
                  // Wait and check again
                  setTimeout(checkStatus, 5000);
                } else {
                  reject(new Error(`Job ${jobId} has unexpected status: ${response.body.status}`));
                }
              });
            };
            checkStatus();
          });
        };
        
        // Wait for both jobs to complete
        cy.wrap(null).then(() => {
          return Cypress.Promise.all([
            waitForCompletion(homeDepotJobId),
            waitForCompletion(lowesJobId, true)
          ]);
        }).then(([homeDepotStatus, lowesStatus]) => {
          // Both jobs are complete, now compare results
          expect(homeDepotStatus.status).to.eq('COMPLETED');
          expect(lowesStatus.status).to.eq('COMPLETED');
          
          // Download and compare results
          cy.request(`/api/download/${homeDepotJobId}`).then(hdResponse => {
            cy.request(`/lowes/api/download/${lowesJobId}`).then(lowesResponse => {
              // Basic validation of CSV content
              const hdLines = hdResponse.body.split('\n');
              const lowesLines = lowesResponse.body.split('\n');
              
              // Check if both have headers and data
              expect(hdLines.length).to.be.at.least(2);
              expect(lowesLines.length).to.be.at.least(2);
              
              // Check if both have similar headers
              const hdHeader = hdLines[0].toLowerCase();
              const lowesHeader = lowesLines[0].toLowerCase();
              
              // Both should have common fields
              ['product', 'name', 'sku', 'price', 'url'].forEach(field => {
                expect(hdHeader).to.include(field);
                expect(lowesHeader).to.include(field);
              });
              
              // Both should have some data rows
              expect(hdLines[1].length).to.be.greaterThan(0);
              expect(lowesLines[1].length).to.be.greaterThan(0);
              
              // Log the number of products found
              cy.log(`Home Depot found ${hdLines.length - 1} products`);
              cy.log(`Lowes found ${lowesLines.length - 1} products`);
            });
          });
        });
      });
    });
  });
  
  it('should compare category results between Home Depot and Lowes', () => {
    // Common category to use for both scrapers
    const category = 'Building Materials';
    let homeDepotJobId, lowesJobId;
    
    // Create a Home Depot job
    cy.visit('/');
    cy.contains('Create New Job').click();
    cy.get('#search_type').select('category');
    cy.get('#category_id').select(category);
    cy.get('#max_pages').clear().type('1');
    cy.get('#max_products').clear().type('5');
    cy.get('#output_format').select('csv');
    
    // Submit the Home Depot job
    cy.intercept('POST', '/api/start_job').as('startHomeDepotJob');
    cy.get('#submit_job').click();
    
    // Wait for the job to be submitted and get the job ID
    cy.wait('@startHomeDepotJob').then((interception) => {
      homeDepotJobId = interception.response.body.job_id;
      
      // Now create a Lowes job with the same category
      cy.visit('/lowes');
      cy.contains('Create New Job').click();
      cy.get('#search_type').select('category');
      cy.get('#category').select(category);
      cy.get('#max_pages').clear().type('1');
      cy.get('#max_products').clear().type('5');
      cy.get('#output_format').select('csv');
      
      // Submit the Lowes job
      cy.intercept('POST', '/lowes/api/create_job').as('startLowesJob');
      cy.get('button[type="submit"]').click();
      
      // Wait for the job to be submitted and get the job ID
      cy.wait('@startLowesJob').then((interception) => {
        lowesJobId = interception.response.body.job_id;
        
        // Wait for both jobs to complete (with a timeout)
        const waitForCompletion = (jobId, isLowes = false) => {
          const baseUrl = isLowes ? '/lowes' : '';
          return new Cypress.Promise((resolve, reject) => {
            const checkStatus = () => {
              cy.request(`${baseUrl}/api/job_status/${jobId}`).then(response => {
                if (response.body.status === 'COMPLETED' || response.body.status === 'FAILED') {
                  resolve(response.body);
                } else if (response.body.status === 'RUNNING') {
                  // Wait and check again
                  setTimeout(checkStatus, 5000);
                } else {
                  reject(new Error(`Job ${jobId} has unexpected status: ${response.body.status}`));
                }
              });
            };
            checkStatus();
          });
        };
        
        // Wait for both jobs to complete
        cy.wrap(null).then(() => {
          return Cypress.Promise.all([
            waitForCompletion(homeDepotJobId),
            waitForCompletion(lowesJobId, true)
          ]);
        }).then(([homeDepotStatus, lowesStatus]) => {
          // Both jobs are complete, now compare results
          expect(homeDepotStatus.status).to.eq('COMPLETED');
          expect(lowesStatus.status).to.eq('COMPLETED');
          
          // Download and compare results
          cy.request(`/api/download/${homeDepotJobId}`).then(hdResponse => {
            cy.request(`/lowes/api/download/${lowesJobId}`).then(lowesResponse => {
              // Basic validation of CSV content
              const hdLines = hdResponse.body.split('\n');
              const lowesLines = lowesResponse.body.split('\n');
              
              // Check if both have headers and data
              expect(hdLines.length).to.be.at.least(2);
              expect(lowesLines.length).to.be.at.least(2);
              
              // Log the number of products found
              cy.log(`Home Depot found ${hdLines.length - 1} products`);
              cy.log(`Lowes found ${lowesLines.length - 1} products`);
            });
          });
        });
      });
    });
  });
});