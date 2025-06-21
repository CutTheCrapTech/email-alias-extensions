import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/',
      'scripts/',
      'packages/*/dist/',
      'packages/**/*.js',
      'packages/**/*.d.ts',
      'packages/*/build.js',
      'packages/*/build.cjs',
      'packages/*/temp/',
      // We should also ignore JS files in the common package that are not the shim
      'packages/common/src/index.js',
    ],
  },

  // Base recommended configs
  ...tseslint.configs.recommended,

  // Main configuration for project TypeScript/JavaScript files
  {
    files: ['**/*.ts'],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // WebExtensions globals
        chrome: 'readonly',
      },
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },

  // Override for CommonJS files, like jest.config.cjs
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // The Prettier config must be last to disable any style rules that conflict with Prettier.
  prettierConfig
);
