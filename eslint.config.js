import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import vitest from "eslint-plugin-vitest";

/**
 * @type {import('eslint').Linter.FlatConfig[]}
 */
export default [
  // 1. Global ignores
  {
    ignores: ["dist/", "node_modules/"],
  },

  // 2. Base configurations for all files
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // 3. Configuration for TypeScript source code across all packages
  {
    files: ["packages/**/src/**/*.ts"],
    // This `ignores` is crucial. It prevents this rule from applying to test files,
    // which will be handled by the next configuration object.
    ignores: ["packages/**/src/__tests__/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        browser: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // 4. Configuration specifically for test files
  {
    files: ["packages/**/src/__tests__/**/*.ts"],
    plugins: {
      vitest,
    },
    rules: {
      // Use the recommended rules from the vitest plugin
      ...vitest.configs.recommended.rules,
    },
    languageOptions: {
      // Define test-specific globals like `describe`, `it`, `expect`
      globals: {
        ...vitest.configs.recommended.globals,
      },
    },
  },

  // 5. Configuration for Node.js scripts (build script, config files)
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // 6. Prettier configuration must be the last item.
  eslintPluginPrettierRecommended,
];
