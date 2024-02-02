import { defineConfig } from "cypress";
export default defineConfig({
    experimentalModifyObstructiveThirdPartyCode: true,
    // experimentalOriginDependencies: true,
    chromeWebSecurity: false,
    component: {
        setupNodeEvents: function (on, config) { },
        specPattern: "src/**/*.test.{js,ts,jsx,tsx}",
    },
    e2e: {
        setupNodeEvents: function (on, config) {
            // implement node event listeners here
        },
    },
    component: {
        devServer: {
            framework: "create-react-app",
            bundler: "webpack",
        },
    },
});
