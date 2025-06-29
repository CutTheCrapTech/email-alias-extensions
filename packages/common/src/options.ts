import { loadSettings, saveSettings } from './storage';
import { ShortcutRecorder } from './shortcuts';

/**
 * A helper function to display a status message to the user.
 * The message automatically disappears after a few seconds.
 *
 * @param message - The text to display.
 * @param isError - If true, styles the message as an error. Defaults to false.
 */
function showStatusMessage(message: string, isError = false): void {
  const statusElement = document.getElementById('status-message');
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.classList.toggle('error', isError);
  statusElement.classList.toggle('success', !isError);
  statusElement.classList.remove('hidden');

  setTimeout(() => {
    statusElement.classList.add('hidden');
  }, 3000);
}

/**
 * Generates a cryptographically secure, URL-safe random string.
 * @param length The desired length of the string.
 * @returns A random string.
 */
function generateSecureRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  // Convert bytes to a URL-safe base64 string and remove padding
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Main execution block that runs when the options page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- Get references to DOM elements ---
  const domainInput = document.getElementById('domain') as HTMLInputElement;
  const tokenInput = document.getElementById('token') as HTMLInputElement;
  const defaultLabelInput = document.getElementById(
    'default-label'
  ) as HTMLInputElement;
  const saveButton = document.getElementById('save-btn') as HTMLButtonElement;

  // New Secret Key elements
  const generateKeyBtn = document.getElementById(
    'generate-key-btn'
  ) as HTMLButtonElement;
  const keyActions = document.getElementById('key-actions') as HTMLDivElement;
  const copyKeyBtn = document.getElementById(
    'copy-key-btn'
  ) as HTMLButtonElement;
  const saveBitwardenBtn = document.getElementById(
    'save-bitwarden-btn'
  ) as HTMLButtonElement;
  const save1PasswordBtn = document.getElementById(
    'save-1password-btn'
  ) as HTMLButtonElement;
  const backupConfirmedCheckbox = document.getElementById(
    'backup-confirmed'
  ) as HTMLInputElement;

  // Keyboard shortcut elements
  const popupShortcutInput = document.getElementById(
    'popup-shortcut'
  ) as HTMLInputElement;
  const fillShortcutInput = document.getElementById(
    'fill-shortcut'
  ) as HTMLInputElement;
  const recordPopupBtn = document.getElementById(
    'record-popup-shortcut'
  ) as HTMLButtonElement;
  const recordFillBtn = document.getElementById(
    'record-fill-shortcut'
  ) as HTMLButtonElement;
  const clearPopupBtn = document.getElementById(
    'clear-popup-shortcut'
  ) as HTMLButtonElement;
  const clearFillBtn = document.getElementById(
    'clear-fill-shortcut'
  ) as HTMLButtonElement;

  // Type guard to ensure all elements were found
  if (
    !domainInput ||
    !tokenInput ||
    !defaultLabelInput ||
    !saveButton ||
    !generateKeyBtn ||
    !keyActions ||
    !copyKeyBtn ||
    !saveBitwardenBtn ||
    !save1PasswordBtn ||
    !backupConfirmedCheckbox ||
    !popupShortcutInput ||
    !fillShortcutInput ||
    !recordPopupBtn ||
    !recordFillBtn ||
    !clearPopupBtn ||
    !clearFillBtn
  ) {
    console.error(
      'Could not find one or more required elements on the options page.'
    );
    return;
  }

  // --- State variable ---
  let isNewKeyGenerated = false;

  // --- Initialize Shortcut Recorder ---
  const shortcutRecorder = new ShortcutRecorder();
  shortcutRecorder.registerShortcut({
    input: popupShortcutInput,
    recordButton: recordPopupBtn,
    clearButton: clearPopupBtn,
  });
  shortcutRecorder.registerShortcut({
    input: fillShortcutInput,
    recordButton: recordFillBtn,
    clearButton: clearFillBtn,
  });

  // --- Event Handlers ---

  generateKeyBtn.addEventListener('click', () => {
    const newKey = generateSecureRandomString(32);
    tokenInput.value = newKey;
    tokenInput.type = 'text'; // Show the key
    keyActions.classList.remove('hidden');
    backupConfirmedCheckbox.checked = false;
    saveButton.disabled = true;
    isNewKeyGenerated = true;
    showStatusMessage('New key generated. Please back it up now.', false);
  });

  copyKeyBtn.addEventListener('click', () => {
    navigator.clipboard
      .writeText(tokenInput.value)
      .then(() => {
        showStatusMessage('Key copied to clipboard!', false);
      })
      .catch(() => {
        showStatusMessage('Failed to copy key.', true);
      });
  });

  saveBitwardenBtn.addEventListener('click', () => {
    void navigator.clipboard.writeText(tokenInput.value);
    window.open('https://vault.bitwarden.com/#/add', '_blank');
  });

  save1PasswordBtn.addEventListener('click', () => {
    void navigator.clipboard.writeText(tokenInput.value);
    window.open('https://my.1password.com/vaults/all/new', '_blank');
  });

  backupConfirmedCheckbox.addEventListener('change', () => {
    saveButton.disabled = !backupConfirmedCheckbox.checked;
  });

  // --- Main Logic ---

  async function loadAndDisplaySettings(): Promise<void> {
    try {
      const settings = await loadSettings();
      domainInput.value = settings.domain || '';
      tokenInput.value = settings.token || '';
      defaultLabelInput.value = settings.defaultLabel || 'marketing';

      if (settings.keyboardShortcuts) {
        popupShortcutInput.value = settings.keyboardShortcuts.openPopup || '';
        fillShortcutInput.value =
          settings.keyboardShortcuts.fillCurrentField || '';
      }

      // If a token already exists, the save button should be enabled.
      // Otherwise, the user must generate a key and confirm backup.
      saveButton.disabled = !settings.token;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatusMessage(`Error loading settings: ${message}`, true);
    }
  }

  saveButton.addEventListener('click', () => {
    void (async () => {
      const domain = domainInput.value.trim();
      const token = tokenInput.value.trim();
      const defaultLabel = defaultLabelInput.value.trim() || 'marketing';

      if (!domain || !token) {
        showStatusMessage('Domain and Secret Key fields are required.', true);
        return;
      }

      if (isNewKeyGenerated && !backupConfirmedCheckbox.checked) {
        showStatusMessage(
          'Please confirm you have backed up the new secret key.',
          true
        );
        return;
      }

      try {
        const keyboardShortcuts = {
          openPopup: popupShortcutInput.value.trim() || undefined,
          fillCurrentField: fillShortcutInput.value.trim() || undefined,
        };

        await saveSettings({
          domain,
          token,
          defaultLabel,
          keyboardShortcuts,
        });

        showStatusMessage('Settings saved successfully!');
        // After saving, reset the state
        isNewKeyGenerated = false;
        keyActions.classList.add('hidden');
        tokenInput.type = 'password';
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusMessage(`Error saving settings: ${message}`, true);
      }
    })();
  });

  // --- Initial Load ---
  void loadAndDisplaySettings();
});
