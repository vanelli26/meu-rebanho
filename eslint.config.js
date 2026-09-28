const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'android/*', 'ios/*'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@react-native-firebase/*'],
              message: 'Telas não importam do Firebase. Use hooks de src/features/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/firebase/**', 'src/features/**', 'src/auth/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
