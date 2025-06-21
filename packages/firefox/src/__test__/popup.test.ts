/**
 * @jest-environment jsdom
 */

import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';
import { initializePopup } from '../popup.js';

// Helper to wait for the next tick of the event loop, allowing promises to resolve.
const flushPromises = () => new Promise(process.nextTick);

// Define the shape of the mock global for type safety.
// This ensures TypeScript knows the return types of our mock functions.
interface MockExt {
  generateEmailAlias: jest.Mock<(prefix: string) => Promise<string>>;
  saveToken: jest.Mock<(token: string) => Promise<void>>;
  getDomain: jest.Mock<() => Promise<string | null>>;
}

describe('Popup UI', () => {
  let prefixInput: HTMLInputElement;
  let generateBtn: HTMLButtonElement;
  let resultContainer: HTMLElement;
  let aliasResult: HTMLElement;
  // copyBtn was removed as it was unused.
  let tokenInput: HTMLInputElement;
  let saveTokenBtn: HTMLButtonElement;
  let statusDiv: HTMLElement;
  let mockExt: MockExt;

  beforeEach(() => {
    // Set up the DOM for each test
    document.body.innerHTML = `
      <div id="status"></div>
      <input id="prefix" />
      <button id="generate-btn"></button>
      <div id="result-container" style="display:none">
        <span id="alias-result"></span>
        <button id="copy-btn"></button>
      </div>
      <input id="token" />
      <button id="save-token-btn"></button>
    `;

    // Assign element references
    prefixInput = document.getElementById('prefix') as HTMLInputElement;
    generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    resultContainer = document.getElementById(
      'result-container'
    ) as HTMLElement;
    aliasResult = document.getElementById('alias-result') as HTMLElement;
    tokenInput = document.getElementById('token') as HTMLInputElement;
    saveTokenBtn = document.getElementById(
      'save-token-btn'
    ) as HTMLButtonElement;
    statusDiv = document.getElementById('status') as HTMLElement;

    // The global mock is set up in `setup.ts`. We cast it to our typed interface.
    mockExt = window.ext as MockExt;
    // Clear mock history before each test run
    mockExt.generateEmailAlias.mockClear();
    mockExt.saveToken.mockClear();
    mockExt.getDomain.mockClear();

    // Call the exported function to attach event listeners to the new DOM
    initializePopup();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = ''; // Clean up DOM
  });

  it('displays an error if the prefix is empty when generating an alias', () => {
    prefixInput.value = '';
    generateBtn.click();
    expect(statusDiv.textContent).toContain('Prefix cannot be empty.');
  });

  it('generates and displays an alias on button click', async () => {
    const testAlias = 'test@example.com';
    mockExt.generateEmailAlias.mockResolvedValue(testAlias);

    prefixInput.value = 'foo';
    generateBtn.click();

    // Wait for async operations to complete
    await flushPromises();

    expect(mockExt.generateEmailAlias).toHaveBeenCalledWith('foo');
    expect(mockExt.generateEmailAlias).toHaveBeenCalledTimes(1);
    expect(aliasResult.textContent).toBe(testAlias);
    expect(resultContainer.style.display).toBe('block');
    expect(statusDiv.textContent).toBe(''); // No error status
  });

  it('saves a token and clears the input field', async () => {
    mockExt.saveToken.mockResolvedValue(undefined);
    tokenInput.value = 'my-secret-token';

    saveTokenBtn.click();

    await flushPromises();

    expect(mockExt.saveToken).toHaveBeenCalledWith('my-secret-token');
    expect(mockExt.saveToken).toHaveBeenCalledTimes(1);
    expect(tokenInput.value).toBe('');
    expect(statusDiv.textContent).toContain('Token saved successfully');
  });

  it('displays an error and disables inputs if core logic is missing', () => {
    // To test the initialization failure, we need a special setup.
    // First, clean up the DOM and mocks from `beforeEach`.
    document.body.innerHTML = '';
    jest.clearAllMocks();

    // Next, simulate the condition where the core logic is not loaded.
    window.ext = undefined;

    // Now, set up the minimal DOM required for this test case.
    document.body.innerHTML = `
      <div id="status"></div>
      <input id="prefix" />
      <button id="generate-btn"></button>
      <input id="token" />
      <button id="save-token-btn"></button>
    `;

    // Manually get the elements for this specific test's DOM.
    const status = document.getElementById('status') as HTMLElement;
    const prefix = document.getElementById('prefix') as HTMLInputElement;
    const generate = document.getElementById(
      'generate-btn'
    ) as HTMLButtonElement;
    const token = document.getElementById('token') as HTMLInputElement;
    const save = document.getElementById('save-token-btn') as HTMLButtonElement;

    // Call the initialization function under the failure condition.
    initializePopup();

    // Assert that the UI is in the disabled/error state.
    expect(status.textContent).toContain('Core logic is missing');
    expect(prefix.disabled).toBe(true);
    expect(generate.disabled).toBe(true);
    expect(token.disabled).toBe(true);
    expect(save.disabled).toBe(true);
  });
});
