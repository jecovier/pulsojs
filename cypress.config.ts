import { defineConfig } from 'cypress';

export default defineConfig({
  chromeWebSecurity: false,
  defaultCommandTimeout: 8000,
  responseTimeout: 120000,

  // macbook-16 based on https://docs.cypress.io/api/commands/viewport#Arguments
  viewportHeight: 960,
  viewportWidth: 1536,

  retries: {
    runMode: 0,
    openMode: 1,
  },

  video: false,
  port: 3031,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:5000/rumi',
    specPattern: ['src/**/*.spec.{js,jsx,ts,tsx}'],
    supportFile: 'cypress/support/e2e.ts',
  },

  numTestsKeptInMemory: 1,
});
