/** Testes das Security Rules. Rode dentro do emulador: firebase emulators:exec "npm run test:rules" */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // O emulador pode demorar para carregar as regras com a máquina ocupada.
  testTimeout: 30000,
  testMatch: ['<rootDir>/__tests__/rules/**/*.test.ts'],
};
