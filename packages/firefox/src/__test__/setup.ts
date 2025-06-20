import { jest } from '@jest/globals';

/**
 * This setup file runs for each test file.
 * It's the ideal place to set up global mocks that are required
 * by the modules under test before they are imported.
 */

// Define the shape of our global extension API mock.
// The generic for jest.Mock should be the function signature itself.
interface MockExt {
  generateEmailAlias: jest.Mock<(prefix: string) => Promise<string>>;
  saveToken: jest.Mock<(token: string) => Promise<void>>;
  getDomain: jest.Mock<() => Promise<string | null>>;
}

// Extend the Window interface to include our custom `ext` property for type safety.
declare global {
  interface Window {
    ext?: MockExt;
  }
}

// The popup script expects a global `ext` object with several methods.
// We mock it here so that when `popup.ts` is imported in our tests,
// it doesn't throw an error trying to access properties of `undefined`.
const mockExt: MockExt = {
  generateEmailAlias: jest.fn(),
  saveToken: jest.fn(),
  getDomain: jest.fn(),
};

window.ext = mockExt;

// JSDOM, the environment Jest uses for DOM testing, doesn't implement `window.close`.
// We mock it to prevent errors if the popup code tries to call it.
window.close = jest.fn();
