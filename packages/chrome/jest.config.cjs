/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the recommended preset for TypeScript projects using ES Modules.
  // This preset configures the `transform` and other necessary options correctly.
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__test__/setup.ts'],
  moduleNameMapper: {
    // Map imports for the common package to its source code for accurate testing.
    '^@email-alias-extensions/common$': '<rootDir>/../common/src/index.ts',

    // Map relative .js imports to their corresponding .ts source files.
    // The `^(\\.{1,2}/.*)` part is crucial: it ensures we only capture
    // relative paths (starting with ./ or ../) and not package imports
    // from node_modules, which was the cause of the previous `react-is` error.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
