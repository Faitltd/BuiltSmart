const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:8082', // Updated to match the server port
    viewportWidth: 1000,
    viewportHeight: 800,
    supportFile: false // This disables the support file requirement
  },
});
