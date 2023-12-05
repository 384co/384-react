import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    setupNodeEvents(on, config) { },
    specPattern: "cypress/e2e/384-tests/*.js",
    // supportFile: false,
    devServer: {
      framework: "create-react-app",
      bundler: "webpack",
    },
  },

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
