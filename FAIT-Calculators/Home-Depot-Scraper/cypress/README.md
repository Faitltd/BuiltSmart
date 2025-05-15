# Cypress Tests for Home Depot Scraper

This directory contains Cypress tests for the Home Depot Scraper web application.

## Test Structure

The tests are organized into three main files:

1. `home_depot_scraper.cy.js` - Tests for the main configuration page
2. `job_details.cy.js` - Tests for the job details page
3. `jobs_list.cy.js` - Tests for the jobs list page

## Running the Tests

To run the tests, you need to have the Home Depot Scraper application running on port 8080. Then, you can run the tests using the following commands:

```bash
# Run all tests in headless mode
npm run cypress:run

# Open Cypress Test Runner for interactive testing
npm run cypress:open
```

## Test Coverage

The tests cover the following functionality:

### Home Page Tests
- Loading the home page
- Checking search type options
- Validating category, search term, and URL list options
- Verifying max products dropdown
- Testing CSV header customization
- Validating directory input
- Checking submit button

### Job Details Tests
- Showing job details for an existing job
- Handling non-existent jobs gracefully

### Jobs List Tests
- Loading the jobs page
- Checking for links to create new jobs
- Verifying job details navigation

## Troubleshooting

If you encounter issues with the tests, check the following:

1. Make sure the application is running on port 8080
2. Verify that the application is accessible at http://localhost:8080
3. Check the Cypress screenshots directory for visual evidence of failures
4. Review the test logs for detailed error messages

## Adding New Tests

To add new tests:

1. Create a new file in the `cypress/e2e` directory with a `.cy.js` extension
2. Follow the existing test patterns for consistency
3. Run the tests to verify they work as expected
