// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // .agents holds installed tooling scripts, not application code.
    ignores: ["dist/*", ".agents/*"],
  }
]);
