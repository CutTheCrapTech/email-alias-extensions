module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This must be the last extension.
  ],
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  globals: {
    // WebExtensions globals
    browser: 'readonly',
    chrome: 'readonly',
    // Custom global from bundled script
    ext: 'readonly',
  },
  rules: {
    // You can add custom rules here.
    // For example, to enforce a specific style for imports:
    // '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  },
  ignorePatterns: ['node_modules/', 'packages/*/dist/', 'packages/*/build.js'],
};
