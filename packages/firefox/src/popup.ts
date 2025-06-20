// This script handles the UI logic for the extension's popup.
// It depends on functions from the 'common' package, which should be loaded
// before this script and exposed on a global object (e.g., `window.ext`).

declare global {
  interface Window {
    ext: {
      generateEmailAlias: (prefix: string) => Promise<string>;
      saveToken: (token: string) => Promise<void>;
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const prefixInput = document.getElementById('prefix') as HTMLInputElement;
  const generateBtn = document.getElementById(
    'generate-btn'
  ) as HTMLButtonElement;
  const resultContainer = document.getElementById(
    'result-container'
  ) as HTMLElement;
  const aliasResult = document.getElementById('alias-result') as HTMLElement;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement;

  const tokenInput = document.getElementById('token') as HTMLInputElement;
  const saveTokenBtn = document.getElementById(
    'save-token-btn'
  ) as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLElement;

  const core = window.ext;

  if (!core || !core.generateEmailAlias || !core.saveToken) {
    displayStatus(
      'Error: Core logic is missing. The extension might be broken.',
      true
    );
    prefixInput.disabled = true;
    generateBtn.disabled = true;
    tokenInput.disabled = true;
    saveTokenBtn.disabled = true;
    return;
  }

  generateBtn.addEventListener('click', async () => {
    clearStatus();
    const prefix = prefixInput.value.trim();
    if (!prefix) {
      displayStatus('Prefix cannot be empty.', true);
      return;
    }

    try {
      const alias = await core.generateEmailAlias(prefix);
      aliasResult.textContent = alias;
      resultContainer.style.display = 'block';
      copyBtn.textContent = 'Copy';
    } catch (error: unknown) {
      displayStatus(
        error instanceof Error ? error.message : String(error),
        true
      );
      resultContainer.style.display = 'none';
    }
  });

  saveTokenBtn.addEventListener('click', async () => {
    clearStatus();
    const token = tokenInput.value;
    try {
      await core.saveToken(token);
      displayStatus('Token saved successfully!', false);
      tokenInput.value = '';
    } catch (error: unknown) {
      displayStatus(
        error instanceof Error ? error.message : String(error),
        true
      );
    }
  });

  copyBtn.addEventListener('click', () => {
    const alias = aliasResult.textContent;
    if (alias) {
      navigator.clipboard
        .writeText(alias)
        .then(() => {
          copyBtn.textContent = 'Copied!';
        })
        .catch((err) => {
          displayStatus('Failed to copy to clipboard.', true);
          console.error('Clipboard error:', err);
        });
    }
  });

  function displayStatus(message: string, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = isError ? 'error' : '';
  }

  function clearStatus() {
    statusDiv.textContent = '';
    statusDiv.className = '';
  }
});
