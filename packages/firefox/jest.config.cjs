/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Use the official ts-jest preset for ES Modules, which correctly handles the necessary transforms.
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__test__/setup.ts'],
  moduleNameMapper: {
    // Map the common package to its source for cross-workspace testing.
    '^@email-alias-extensions/common$': '<rootDir>/../common/src/index.ts',
    // For ESM, imports need extensions. This maps relative .js imports in tests back to their .ts source files.
    // The regex `^(\\.{1,2}/.*)` is crucial to only match relative paths (./ or ../) and avoid breaking node_modules imports.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
