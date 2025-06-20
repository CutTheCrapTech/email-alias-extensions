import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['node_modules/', 'packages/*/dist/', 'packages/*/build/'],
  },

  // Base recommended configs
  ...tseslint.configs.recommended,

  // Main configuration for project TypeScript/JavaScript files
  {
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // WebExtensions globals
        chrome: 'readonly',
        ext: 'readonly',
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      // You can add your custom rules here.
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
