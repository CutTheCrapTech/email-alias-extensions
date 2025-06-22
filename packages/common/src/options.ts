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
  statusElement.classList.toggle('success', !isError); // Assuming a 'success' class for styling
  statusElement.classList.remove('hidden');

  // Hide the message after 3 seconds
  setTimeout(() => {
    statusElement.classList.add('hidden');
  }, 3000);
}

/**
 * Main execution block that runs when the options page is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Get references to the crucial DOM elements
  const domainInput = document.getElementById('domain') as HTMLInputElement;
  const tokenInput = document.getElementById('token') as HTMLInputElement;
  const defaultLabelInput = document.getElementById(
    'default-label'
  ) as HTMLInputElement;
  const saveButton = document.getElementById('save-btn') as HTMLButtonElement;

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

  // Initialize shortcut recorder and register shortcuts
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

  /**
   * Loads the current settings from storage and populates the input fields.
   */
  async function loadAndDisplaySettings(): Promise<void> {
    try {
      const settings = await loadSettings();
      domainInput.value = settings.domain || '';
      tokenInput.value = settings.token || '';
      defaultLabelInput.value =
        typeof settings.defaultLabel === 'string'
          ? settings.defaultLabel
          : 'marketing';

      // Load keyboard shortcuts
      if (settings.keyboardShortcuts) {
        popupShortcutInput.value = settings.keyboardShortcuts.openPopup || '';
        fillShortcutInput.value =
          settings.keyboardShortcuts.fillCurrentField || '';
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatusMessage(`Error loading settings: ${message}`, true);
    }
  }

  /**
   * Handles the save button click event.
   * It retrieves values from the inputs, saves them, and provides feedback.
   */
  saveButton.addEventListener('click', () => {
    // This is an async IIFE (Immediately Invoked Function Expression).
    // It allows us to use `await` inside the event listener without making
    // the listener itself async, which would violate the no-misused-promises rule.
    void (async () => {
      const domain = domainInput.value.trim();
      const token = tokenInput.value.trim();
      const defaultLabel = defaultLabelInput.value.trim() || 'marketing'; // Fallback to 'marketing' if empty

      if (!domain || !token) {
        showStatusMessage('Domain and Token fields are required.', true);
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
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'An unknown error occurred.';
        showStatusMessage(`Error saving settings: ${message}`, true);
      }
    })();
  });

  // Initially load the settings when the page is opened.
  // We use `void` here to explicitly mark the promise as intentionally unhandled,
  // fixing the no-floating-promises lint error.
  void loadAndDisplaySettings();
});
