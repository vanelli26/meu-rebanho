/** Testes das Security Rules. Rode dentro do emulador: firebase emulators:exec "npm run test:rules" */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/rules/**/*.test.ts'],
};
