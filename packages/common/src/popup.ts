import { generateEmailAlias, ApiError } from './api';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element Selection ---
  const labelInput = document.getElementById('label-input') as HTMLInputElement | null;
  const sourceInput = document.getElementById('source-input') as HTMLInputElement | null;
  const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
  const resultContainer = document.getElementById('result-container') as HTMLDivElement | null;
  const aliasResultSpan = document.getElementById('alias-result') as HTMLSpanElement | null;
  const copyBtn = document.getElementById('copy-btn') as HTMLButtonElement | null;
  const errorContainer = document.getElementById('error-container') as HTMLDivElement | null;

  // --- Type Guard ---
  if (!labelInput || !sourceInput || !generateBtn || !resultContainer || !aliasResultSpan || !copyBtn || !errorContainer) {
    const message = 'A critical UI element is missing from popup.html and the extension cannot function.';
    console.error(message);
    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
    }
    return;
  }

  // --- UI Helper Functions ---

  const showError = (message: string) => {
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
    resultContainer.classList.add('hidden');
  };

  const hideError = () => {
    if (!errorContainer.classList.contains('hidden')) {
      errorContainer.classList.add('hidden');
      errorContainer.textContent = '';
    }
  };

  const showResult = (alias: string) => {
    aliasResultSpan.textContent = alias;
    resultContainer.classList.remove('hidden');
    hideError();
  };

  // --- Event Handlers ---

  const onGenerateClick = async () => {
    // Get values from both inputs and trim them for validation
    const label = labelInput.value.trim();
    const source = sourceInput.value.trim();

    // Perform immediate UI-level validation for better user experience
    if (!label || !source) {
      showError('Both Label and Source fields are required.');
      return;
    }

    // Construct the array to pass to the API
    const aliasParts = [label, source];

    // Clear previous state and disable button
    hideError();
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      // Pass the array directly to the API
      const alias = await generateEmailAlias(aliasParts);
      showResult(alias);
    } catch (error) {
      if (error instanceof ApiError) {
        showError(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
        showError('An unexpected error occurred. Please check the console.');
      }
    } finally {
      // Re-enable the button
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    }
  };

  const onCopyClick = async () => {
    const alias = aliasResultSpan.textContent;
    if (!alias) return;

    try {
      await navigator.clipboard.writeText(alias);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    } catch (err) {
      console.error('Failed to copy alias to clipboard: ', err);
      showError('Could not copy alias to clipboard.');
    }
  };

  // --- Event Listener Registration ---
  generateBtn.addEventListener('click', onGenerateClick);
  copyBtn.addEventListener('click', onCopyClick);

  const onEnterPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onGenerateClick();
    }
  };

  labelInput.addEventListener('keydown', onEnterPress);
  sourceInput.addEventListener('keydown', onEnterPress);
});
