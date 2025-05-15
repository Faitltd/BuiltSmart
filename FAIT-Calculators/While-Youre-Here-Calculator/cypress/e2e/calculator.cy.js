describe('Handyman Cost Calculator', () => {
  beforeEach(() => {
    // Updated to use port 8082
    cy.visit('http://localhost:8082/calculator.html');
  });

  it('should load the calculator', () => {
    cy.get('h1').should('contain', 'HANDYMAN COST CALCULATOR');
    cy.get('#task').should('exist');
    cy.get('.calculate-btn').should('exist');
    cy.get('#estimateBox').should('contain', 'SELECT A TASK TO SEE PRICING');
  });

  it('should calculate drywall estimates correctly', () => {
    cy.get('#task').select('drywall');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $200 - $800');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $240 - $900');
  });

  it('should calculate painting estimates correctly', () => {
    cy.get('#task').select('painting');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $50 - $150');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $60 - $180');
  });

  it('should calculate door alignment estimates correctly', () => {
    cy.get('#task').select('doorAlign');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $50 - $100');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $60 - $120');
  });

  it('should calculate TV mounting estimates correctly', () => {
    cy.get('#task').select('tvMount');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $100 - $300');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $120 - $360');
  });

  it('should calculate gutter cleaning estimates correctly', () => {
    cy.get('#task').select('gutterClean');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $100 - $225');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $120 - $270');
  });

  it('should calculate leaky faucet repair estimates correctly', () => {
    cy.get('#task').select('leakyFaucet');
    cy.get('.calculate-btn').click();
    cy.get('#estimateBox').should('contain', 'INDEPENDENT HANDYMAN: $65 - $150');
    cy.get('#estimateBox').should('contain', 'LICENSED CONTRACTOR: $80 - $190');
  });

  it('should animate the icon when calculating', () => {
    cy.get('#task').select('drywall');
    cy.get('.calculate-btn').click();
    cy.get('#icon').should('have.class', 'pop');
    // Wait for animation to complete
    cy.wait(300);
    cy.get('#icon').should('not.have.class', 'pop');
  });
});
