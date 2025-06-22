import browser from 'webextension-polyfill';
import { generateEmailAlias, ApiError } from './api';

// Define message types
interface ShowAliasDialogMessage {
  action: 'showAliasDialog';
  targetElementInfo: {
    frameId: number;
  };
}

interface FillEmailFieldMessage {
  action: 'fillEmailField';
  alias: string;
}

type ContentMessage = ShowAliasDialogMessage | FillEmailFieldMessage;

// Store reference to the currently focused input element
let currentTarget: HTMLInputElement | HTMLTextAreaElement | null = null;

// Type guard to check if message is a valid ContentMessage
function isContentMessage(message: unknown): message is ContentMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'action' in message &&
    typeof (message as { action: unknown }).action === 'string'
  );
}

// Listen for messages from the background script
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isContentMessage(message)) {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }

  if (message.action === 'showAliasDialog') {
    showAliasGenerationDialog();
    sendResponse({ success: true });
  } else if (message.action === 'fillEmailField') {
    const filled = fillEmailField(message.alias);
    sendResponse({ success: filled });
  }

  return true;
});

// Track the currently focused input element
document.addEventListener('focusin', (event) => {
  const target = event.target as HTMLElement;
  if (isEmailInput(target)) {
    currentTarget = target as HTMLInputElement | HTMLTextAreaElement;
  }
});

document.addEventListener('focusout', () => {
  // Don't clear currentTarget immediately, as the context menu might be opening
  setTimeout(() => {
    if (!document.querySelector('.alias-dialog')) {
      currentTarget = null;
    }
  }, 100);
});

/**
 * Extract domain name from current URL for auto-filling source
 */
function extractDomainForSource(): string {
  try {
    const hostname = window.location.hostname.toLowerCase();

    // Remove common prefixes
    const cleanHostname = hostname
      .replace(
        /^(www\.|m\.|mobile\.|login\.|signin\.|auth\.|account\.|accounts\.|secure\.)/,
        ''
      )
      .replace(/^(api\.|app\.|web\.)/, '');

    // Extract main domain name (remove subdomains for common cases)
    const parts = cleanHostname.split('.');

    // Handle common cases
    if (parts.length >= 2) {
      // For domains like github.com, google.com, amazon.com
      const mainDomain = parts[parts.length - 2];

      // Handle special cases
      const domainMappings: Record<string, string> = {
        githubusercontent: 'github',
        googleusercontent: 'google',
        amazoncognito: 'amazon',
        amazonaws: 'amazon',
        office365: 'microsoft',
        live: 'microsoft',
        outlook: 'microsoft',
        hotmail: 'microsoft',
        msn: 'microsoft',
      };

      return domainMappings[mainDomain!] || mainDomain!;
    }

    return cleanHostname;
  } catch (error) {
    console.warn('Failed to extract domain:', error);
    return '';
  }
}

/**
 * Enhanced email input field detection for modern web forms
 * This function uses multiple strategies to identify email input fields
 */
function isEmailInput(element: HTMLElement): boolean {
  if (element.tagName === 'INPUT') {
    const input = element as HTMLInputElement;

    // Strategy 1: Explicit email type
    if (input.type === 'email') {
      return true;
    }

    // Strategy 2: Text inputs with email-related attributes
    if (input.type === 'text') {
      // Check autocomplete attribute for email hints
      const autocomplete = input.autocomplete?.toLowerCase();
      if (autocomplete === 'email' || autocomplete === 'username') {
        return true;
      }

      // Check common email-related attribute patterns
      const emailPatterns = [
        /email/i,
        /mail/i,
        /user.*name/i, // username, user-name, etc.
        /login/i,
        /signin/i,
        /account/i,
      ];

      const attributesToCheck = [
        input.name || '',
        input.placeholder || '',
        input.id || '',
        input.className || '',
        input.getAttribute('aria-label') || '',
        input.getAttribute('data-testid') || '',
        input.getAttribute('data-cy') || '', // Cypress test attribute
      ];

      // Check if any attribute matches email patterns
      for (const attr of attributesToCheck) {
        if (emailPatterns.some((pattern) => pattern.test(attr))) {
          return true;
        }
      }

      // Strategy 3: Context-based detection
      // Check if the input is in a login/signup form
      const form = input.closest('form');
      if (form) {
        const formAttributes = [
          form.id || '',
          form.className || '',
          form.getAttribute('aria-label') || '',
        ];

        const formPatterns = [
          /login/i,
          /signin/i,
          /signup/i,
          /register/i,
          /auth/i,
        ];

        const isAuthForm = formAttributes.some((attr) =>
          formPatterns.some((pattern) => pattern.test(attr))
        );

        if (isAuthForm) {
          // In auth forms, look for the first text input that might be email
          const textInputs = form.querySelectorAll('input[type="text"]');
          if (textInputs.length > 0 && textInputs[0] === input) {
            return true;
          }
        }
      }

      // Strategy 4: Check surrounding labels
      const label =
        input.labels?.[0] ||
        document.querySelector(`label[for="${input.id}"]`) ||
        input.closest('label');

      if (label) {
        const labelText = label.textContent?.toLowerCase() || '';
        if (/email|mail|username|login|signin|account/.test(labelText)) {
          return true;
        }
      }

      // Strategy 5: Check if it's a single text input in a simple form
      // (common pattern for search boxes that might accept emails)
      if (form && form.querySelectorAll('input[type="text"]').length === 1) {
        // Check if form has search-related attributes
        const searchPatterns = [/search/i, /query/i, /find/i];

        const formSearchAttrs = [
          form.id || '',
          form.className || '',
          form.getAttribute('role') || '',
        ];

        const isSearchForm = formSearchAttrs.some((attr) =>
          searchPatterns.some((pattern) => pattern.test(attr))
        );

        // For search forms, be more permissive as they often accept emails
        if (isSearchForm) {
          return true;
        }
      }
    }
  }

  // Handle textarea elements (less common but possible)
  if (element.tagName === 'TEXTAREA') {
    const textarea = element as HTMLTextAreaElement;
    const emailPatterns = [/email/i, /mail/i];

    const attributesToCheck = [
      textarea.name || '',
      textarea.placeholder || '',
      textarea.id || '',
      textarea.className || '',
    ];

    return attributesToCheck.some((attr) =>
      emailPatterns.some((pattern) => pattern.test(attr))
    );
  }

  return false;
}

/**
 * Enhanced function to find email fields with better prioritization
 */
function findBestEmailInput(): HTMLInputElement | HTMLTextAreaElement | null {
  // Strategy 1: Currently focused element
  const activeElement = document.activeElement;
  if (activeElement && isEmailInput(activeElement as HTMLElement)) {
    return activeElement as HTMLInputElement | HTMLTextAreaElement;
  }

  // Strategy 2: Look for explicit email inputs first
  const emailInputs = document.querySelectorAll('input[type="email"]');
  if (emailInputs.length > 0) {
    const visible = Array.from(emailInputs).find((input) =>
      isVisible(input as HTMLElement)
    );
    if (visible) {
      return visible as HTMLInputElement;
    }
  }

  // Strategy 3: Look for inputs with email autocomplete
  const autocompleteInputs = document.querySelectorAll(
    'input[autocomplete="email"], input[autocomplete="username"]'
  );
  if (autocompleteInputs.length > 0) {
    const visible = Array.from(autocompleteInputs).find((input) =>
      isVisible(input as HTMLElement)
    );
    if (visible) {
      return visible as HTMLInputElement;
    }
  }

  // Strategy 4: Search all text inputs and textareas
  const allInputs = document.querySelectorAll(
    'input[type="text"], input[type="email"], textarea'
  );

  const candidates: Array<{
    element: HTMLInputElement | HTMLTextAreaElement;
    score: number;
  }> = [];

  for (const input of allInputs) {
    if (isEmailInput(input as HTMLElement) && isVisible(input as HTMLElement)) {
      const element = input as HTMLInputElement | HTMLTextAreaElement;
      let score = 0;

      // Scoring system to prioritize the best match
      if (element.type === 'email') score += 10;
      if (element.autocomplete === 'email') score += 8;
      if (element.autocomplete === 'username') score += 6;
      if (/email/i.test(element.name || '')) score += 5;
      if (/email/i.test(element.id || '')) score += 4;
      if (/email/i.test(element.placeholder || '')) score += 3;
      if (element.closest('form')) score += 2;
      if (element.labels?.length) score += 1;

      candidates.push({ element, score });
    }
  }

  // Return the highest scoring candidate
  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0]!.element;
  }

  return null;
}

/**
 * Fill the currently focused email field or find an email field to fill
 */
function fillEmailField(alias: string): boolean {
  // First try to fill the currently tracked target
  if (currentTarget && document.contains(currentTarget)) {
    currentTarget.value = alias;
    currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
    currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  // Use the enhanced email field detection
  const emailInput = findBestEmailInput();
  if (emailInput) {
    emailInput.value = alias;
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    emailInput.focus(); // Focus the field we just filled
    return true;
  }

  return false; // No suitable field found
}

/**
 * Check if an element is visible on the page
 */
function isVisible(element: HTMLElement): boolean {
  return !!(
    element.offsetWidth ||
    element.offsetHeight ||
    element.getClientRects().length
  );
}

/**
 * Show the alias generation dialog
 */
function showAliasGenerationDialog(): void {
  // Remove any existing dialog
  const existingDialog = document.querySelector('.alias-dialog');
  if (existingDialog) {
    existingDialog.remove();
  }

  // Auto-fill values
  const autoSource = extractDomainForSource();
  const autoLabel = 'marketing';

  // Create dialog HTML
  const dialog = document.createElement('div');
  dialog.className = 'alias-dialog';
  dialog.innerHTML = `
    <div class="alias-dialog-overlay">
      <div class="alias-dialog-content">
        <div class="alias-dialog-header">
          <h3>Generate Email Alias</h3>
          <button class="alias-dialog-close" type="button">&times;</button>
        </div>
        <div class="alias-dialog-body">
          <div class="alias-dialog-field">
            <label for="alias-label">Label:</label>
            <input type="text" id="alias-label" value="${autoLabel}" />
            <div class="auto-fill-hint ${autoLabel ? '' : 'hidden'}" id="label-hint">
              Auto-filled with default. <span class="change-hint">Click to change</span>
            </div>
          </div>
          <div class="alias-dialog-field">
            <label for="alias-source">Source:</label>
            <input type="text" id="alias-source" value="${autoSource}" placeholder="e.g., amazon" />
            <div class="auto-fill-hint ${autoSource ? '' : 'hidden'}" id="source-hint">
              Auto-filled from current site. <span class="change-hint">Click to change</span>
            </div>
          </div>
          <div class="alias-dialog-actions">
            <button id="alias-generate-btn" type="button">Generate Alias</button>
            <button id="alias-cancel-btn" type="button">Cancel</button>
          </div>
          <div id="alias-dialog-error" class="alias-dialog-error hidden"></div>
        </div>
      </div>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .alias-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    }

    .alias-dialog-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .alias-dialog-content {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      width: 420px;
      max-width: 90vw;
    }

    .alias-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
    }

    .alias-dialog-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .alias-dialog-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .alias-dialog-close:hover {
      background: #f0f0f0;
      color: #333;
    }

    .alias-dialog-body {
      padding: 20px;
    }

    .alias-dialog-field {
      margin-bottom: 20px;
    }

    .alias-dialog-field label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
      font-size: 14px;
    }

    .alias-dialog-field input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .alias-dialog-field input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .auto-fill-hint {
      margin-top: 6px;
      font-size: 12px;
      color: #dc3545;
      background: #fff5f5;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #fecaca;
    }

    .change-hint {
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }

    .change-hint:hover {
      color: #b91c1c;
    }

    .alias-dialog-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .alias-dialog-actions button {
      padding: 10px 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }

    #alias-generate-btn {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    #alias-generate-btn:hover:not(:disabled) {
      background: #0056b3;
      border-color: #0056b3;
      transform: translateY(-1px);
    }

    #alias-generate-btn:disabled {
      background: #6c757d;
      border-color: #6c757d;
      cursor: not-allowed;
      transform: none;
    }

    #alias-cancel-btn {
      background: white;
      color: #333;
    }

    #alias-cancel-btn:hover {
      background: #f8f9fa;
      border-color: #adb5bd;
    }

    .alias-dialog-error {
      margin-top: 16px;
      padding: 12px;
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 6px;
      font-size: 14px;
    }

    .hidden {
      display: none !important;
    }

    /* Animation for dialog appearance */
    .alias-dialog {
      animation: dialogFadeIn 0.2s ease-out;
    }

    .alias-dialog-content {
      animation: dialogSlideIn 0.3s ease-out;
    }

    @keyframes dialogFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes dialogSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (prefers-color-scheme: dark) {
      .alias-dialog-content {
        background: #2d3748;
        color: #e2e8f0;
      }

      .alias-dialog-header {
        border-bottom-color: #4a5568;
      }

      .alias-dialog-header h3 {
        color: #e2e8f0;
      }

      .alias-dialog-close {
        color: #a0aec0;
      }

      .alias-dialog-close:hover {
        background: #4a5568;
        color: #e2e8f0;
      }

      .alias-dialog-field label {
        color: #a0aec0;
      }

      .alias-dialog-field input {
        background: #4a5568;
        border-color: #718096;
        color: #e2e8f0;
      }

      .alias-dialog-field input:focus {
        border-color: #63b3ed;
        box-shadow: 0 0 0 3px rgba(99, 179, 237, 0.1);
      }

      .auto-fill-hint {
        background: #2d1b1b;
        border-color: #4a2c2c;
        color: #fbb6ce;
      }

      .change-hint:hover {
        color: #f687b3;
      }

      #alias-cancel-btn {
        background: #4a5568;
        color: #e2e8f0;
        border-color: #718096;
      }

      #alias-cancel-btn:hover {
        background: #2d3748;
        border-color: #a0aec0;
      }

      .alias-dialog-error {
        background: #2d1b1b;
        color: #fbb6ce;
        border-color: #4a2c2c;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(dialog);

  // Get dialog elements
  const labelInput = dialog.querySelector('#alias-label') as HTMLInputElement;
  const sourceInput = dialog.querySelector('#alias-source') as HTMLInputElement;
  const generateBtn = dialog.querySelector(
    '#alias-generate-btn'
  ) as HTMLButtonElement;
  const cancelBtn = dialog.querySelector(
    '#alias-cancel-btn'
  ) as HTMLButtonElement;
  const closeBtn = dialog.querySelector(
    '.alias-dialog-close'
  ) as HTMLButtonElement;
  const errorDiv = dialog.querySelector(
    '#alias-dialog-error'
  ) as HTMLDivElement;
  const labelHint = dialog.querySelector('#label-hint') as HTMLDivElement;
  const sourceHint = dialog.querySelector('#source-hint') as HTMLDivElement;

  // Helper functions
  const closeDialog = () => {
    dialog.style.animation = 'dialogFadeOut 0.2s ease-in forwards';
    setTimeout(() => {
      dialog.remove();
      style.remove();
      currentTarget = null;
    }, 200);
  };

  const showError = (message: string) => {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  };

  const hideError = () => {
    errorDiv.classList.add('hidden');
    errorDiv.textContent = '';
  };

  // Auto-fill hint interactions
  const setupHintInteraction = (
    input: HTMLInputElement,
    hint: HTMLDivElement
  ) => {
    const hideHint = () => {
      hint.classList.add('hidden');
    };

    const showHint = () => {
      if (input.value) {
        hint.classList.remove('hidden');
      }
    };

    input.addEventListener('focus', hideHint);
    input.addEventListener('input', () => {
      if (input.value !== input.defaultValue) {
        hideHint();
      }
    });
    input.addEventListener('blur', showHint);

    hint.addEventListener('click', () => {
      input.focus();
      input.select();
    });
  };

  setupHintInteraction(labelInput, labelHint);
  setupHintInteraction(sourceInput, sourceHint);

  // Event listeners
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog.querySelector('.alias-dialog-overlay')) {
      closeDialog();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDialog();
    }
  });

  const handleGenerate = async () => {
    const label = labelInput.value.trim();
    const source = sourceInput.value.trim();

    if (!label || !source) {
      showError('Both Label and Source fields are required.');
      return;
    }

    hideError();
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';

    try {
      const alias = await generateEmailAlias([label, source]);

      // Fill the target input with the generated alias
      if (currentTarget) {
        currentTarget.value = alias;
        currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
        currentTarget.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        // Try to find and fill the best email input
        const emailInput = findBestEmailInput();
        if (emailInput) {
          emailInput.value = alias;
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.dispatchEvent(new Event('change', { bubbles: true }));
          emailInput.focus();
        }
      }

      closeDialog();
    } catch (error) {
      if (error instanceof ApiError) {
        showError(error.message);
      } else {
        console.error('An unexpected error occurred:', error);
        showError('An unexpected error occurred. Please check the console.');
      }
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Generate Alias';
    }
  };

  generateBtn.addEventListener('click', () => {
    void handleGenerate();
  });

  // Handle Enter key in inputs
  [labelInput, sourceInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleGenerate();
      }
    });
  });

  // Auto-generate if both fields are filled and user hasn't interacted yet
  if (autoLabel && autoSource) {
    // Add a subtle delay to let user see the auto-fill
    setTimeout(() => {
      if (labelInput.value === autoLabel && sourceInput.value === autoSource) {
        // User hasn't changed the values, show hint they can quick-generate
        generateBtn.textContent = 'Generate with Auto-fill';
        generateBtn.style.background = '#28a745';
        generateBtn.style.borderColor = '#28a745';
      }
    }, 1000);
  }

  // Focus the first empty input or the source input if everything is filled
  if (!autoLabel) {
    labelInput.focus();
  } else if (!autoSource) {
    sourceInput.focus();
  } else {
    // Both are filled, focus source for easy modification
    sourceInput.focus();
    sourceInput.select();
  }
}
