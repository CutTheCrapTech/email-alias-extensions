import { generateEmailAlias, ApiError } from './api';

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element Selection ---
  const labelInput = document.getElementById(
    'label-input'
  ) as HTMLInputElement | null;
  const sourceInput = document.getElementById(
    'source-input'
  ) as HTMLInputElement | null;
  const generateBtn = document.getElementById(
    'generate-btn'
  ) as HTMLButtonElement | null;
  const resultContainer = document.getElementById(
    'result-container'
  ) as HTMLDivElement | null;
  const aliasResultSpan = document.getElementById(
    'alias-result'
  ) as HTMLSpanElement | null;
  const copyBtn = document.getElementById(
    'copy-btn'
  ) as HTMLButtonElement | null;
  const errorContainer = document.getElementById(
    'error-container'
  ) as HTMLDivElement | null;

  // --- Type Guard ---
  if (
    !labelInput ||
    !sourceInput ||
    !generateBtn ||
    !resultContainer ||
    !aliasResultSpan ||
    !copyBtn ||
    !errorContainer
  ) {
    const message =
      'A critical UI element is missing from popup.html and the extension cannot function.';
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

  // --- Core Async Logic ---

  const handleGeneration = async () => {
    const label = labelInput.value.trim();
    const source = sourceInput.value.trim();

    if (!label || !source) {
      showError('Both Label and Source fields are required.');
      return;
    }

    const aliasParts = [label, source];

    hideError();
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
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
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate';
    }
  };

  const handleCopy = async () => {
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

  // Use simple, non-async listeners that call the core async logic.
  // The `void` operator correctly handles the returned promise.
  generateBtn.addEventListener('click', () => {
    void handleGeneration();
  });

  copyBtn.addEventListener('click', () => {
    void handleCopy();
  });

  const onEnterPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void handleGeneration();
    }
  };

  labelInput.addEventListener('keydown', onEnterPress);
  sourceInput.addEventListener('keydown', onEnterPress);
});
