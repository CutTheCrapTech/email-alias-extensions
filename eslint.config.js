import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import vitest from 'eslint-plugin-vitest';

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  // 1. Global ignores
  {
    ignores: ['dist/', 'node_modules/'],
  },

  // 2. Base configurations for all files
  js.configs.recommended,
  ...tseslint.configs.recommended, // This is an array, spread into the top-level array. Correct.

  // 3. Configuration for TypeScript source code across all packages
  // This section is now correctly split into two parts.

  // Part A: Apply the recommended type-checked configs, scoped to the correct files.
  // We map over the array of configs and add `files` and `ignores` to each one.
  // The result is an array of new config objects, which is then correctly spread
  // into the top-level configuration array.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['packages/**/src/**/*.ts'],
    ignores: ['packages/**/src/__tests__/**/*.ts'],
  })),

  // Part B: Add our own specific options and rules for the same set of files.
  // This is a separate, single configuration object.
  {
    files: ['packages/**/src/**/*.ts'],
    ignores: ['packages/**/src/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        browser: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // 4. Configuration specifically for test files
  {
    files: ['packages/**/src/__tests__/**/*.ts'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      globals: {
        ...vitest.configs.recommended.globals,
      },
    },
  },

  // 5. Configuration for Node.js scripts (build script, config files)
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 6. Prettier configuration must be the last item.
  eslintPluginPrettierRecommended,
];
