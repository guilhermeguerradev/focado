// Configuração do ESLint (o "revisor de código").
// - expoConfig: regras oficiais recomendadas para projetos Expo.
// - prettierConfig: desliga regras de formatação, que ficam só com o Prettier.
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', 'docs/*'],
  },
]);
