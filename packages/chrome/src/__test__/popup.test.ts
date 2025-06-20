/**
 * @jest-environment jsdom
 */

export {};

// No global augmentation, just use window as any for test mocks

describe('Popup UI', () => {
  let prefixInput: HTMLInputElement;
  let generateBtn: HTMLButtonElement;
  let resultContainer: HTMLElement;
  let aliasResult: HTMLElement;
  let copyBtn: HTMLButtonElement;
  let tokenInput: HTMLInputElement;
  let saveTokenBtn: HTMLButtonElement;
  let statusDiv: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = `
      <input id="prefix" />
      <button id="generate-btn"></button>
      <div id="result-container" style="display:none"></div>
      <span id="alias-result"></span>
      <button id="copy-btn"></button>
      <input id="token" />
      <button id="save-token-btn"></button>
      <div id="status"></div>
    `;
    prefixInput = document.getElementById('prefix') as HTMLInputElement;
    generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    resultContainer = document.getElementById('result-container') as HTMLElement;
    aliasResult = document.getElementById('alias-result') as HTMLElement;
    copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;
    tokenInput = document.getElementById('token') as HTMLInputElement;
    saveTokenBtn = document.getElementById('save-token-btn') as HTMLButtonElement;
    statusDiv = document.getElementById('status') as HTMLElement;
    (window as any).ext = {
      generateEmailAlias: jest.fn().mockResolvedValue('alias@example.com'),
      saveToken: jest.fn().mockResolvedValue(undefined),
    };
    jest.resetModules();
    require('../popup');
  });

  it('displays error if prefix is empty', () => {
    generateBtn.click();
    expect(statusDiv.textContent).toMatch(/Prefix cannot be empty/);
  });

  it('generates alias and displays it', async () => {
    prefixInput.value = 'foo';
    generateBtn.click();
    await Promise.resolve(); // allow async
    expect((window as any).ext.generateEmailAlias).toHaveBeenCalledWith('foo');
    expect(aliasResult.textContent).toBe('alias@example.com');
    expect(resultContainer.style.display).toBe('block');
  });

  it('saves token and clears input', async () => {
    tokenInput.value = 'tok';
    saveTokenBtn.click();
    await Promise.resolve();
    expect((window as any).ext.saveToken).toHaveBeenCalledWith('tok');
    expect(tokenInput.value).toBe('');
    expect(statusDiv.textContent).toMatch(/Token saved successfully/);
  });

  it('displays error if core is missing', () => {
    // Remove ext
    (window as any).ext = undefined;
    jest.resetModules();
    require('../popup');
    expect(statusDiv.textContent).toMatch(/Core logic is missing/);
    expect(prefixInput.disabled).toBe(true);
    expect(generateBtn.disabled).toBe(true);
    expect(tokenInput.disabled).toBe(true);
    expect(saveTokenBtn.disabled).toBe(true);
  });
}); 