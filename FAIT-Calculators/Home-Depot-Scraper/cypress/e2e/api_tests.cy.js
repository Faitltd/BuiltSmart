describe('API Endpoints', () => {
  it('should get job status via API', () => {
    // Create a job first
    cy.request('POST', '/api/start_job', {
      search_type: 'search_term',
      search_terms: ['building materials'],
      max_pages: 1,
      max_products: 5,
      output_format: 'csv'
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('job_id');
      
      const jobId = response.body.job_id;
      
      // Get job status
      cy.request(`/api/job_status/${jobId}`).then((statusResponse) => {
        expect(statusResponse.status).to.eq(200);
        expect(statusResponse.body).to.have.property('status');
        expect(statusResponse.body).to.have.property('progress');
      });
    });
  });
  
  it('should list all jobs via API', () => {
    cy.request('/api/jobs').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.be.an('array');
    });
  });
  
  it('should validate directory via API', () => {
    cy.request('POST', '/api/validate_dir', {
      directory: 'data/test'
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('valid');
      expect(response.body).to.have.property('path');
    });
  });
  
  it('should handle invalid API requests gracefully', () => {
    // Test with invalid job ID
    cy.request({
      url: '/api/job_status/invalid_id',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404);
    });
    
    // Test with invalid directory
    cy.request({
      method: 'POST',
      url: '/api/validate_dir',
      body: { directory: '/invalid/path/that/should/not/exist' },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.valid).to.eq(false);
    });
  });
});
