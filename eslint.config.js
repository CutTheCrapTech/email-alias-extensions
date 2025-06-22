import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import vitest from 'eslint-plugin-vitest';
import path from 'node:path';

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
  ...tseslint.configs.recommended,

  // 3. TypeScript source code configuration
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['packages/**/src/**/*.ts'],
    ignores: ['packages/**/src/__tests__/**/*.ts'],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        project: true,
        tsconfigRootDir: path.resolve(import.meta.dirname),
      },
    },
  })),

  // 4. Project-specific TypeScript rules
  {
    files: ['packages/**/src/**/*.ts'],
    ignores: ['packages/**/src/__tests__/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: path.resolve(import.meta.dirname),
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

  // 5. Test configuration
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

  // 6. Node.js scripts
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 7. Prettier must be last
  eslintPluginPrettierRecommended,
];
