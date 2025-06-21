import { loadSettings, saveSettings } from './storage';

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
  const domainInput = document.getElementById('domain') as HTMLInputElement | null;
  const tokenInput = document.getElementById('token') as HTMLInputElement | null;
  const saveButton = document.getElementById('save-btn') as HTMLButtonElement | null;

  // Type guard to ensure all elements were found
  if (!domainInput || !tokenInput || !saveButton) {
    console.error('Could not find one or more required elements on the options page.');
    return;
  }

  /**
   * Loads the current settings from storage and populates the input fields.
   */
  async function loadAndDisplaySettings(): Promise<void> {
    try {
      const settings = await loadSettings();
      domainInput.value = settings.domain || '';
      tokenInput.value = settings.token || '';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatusMessage(`Error loading settings: ${message}`, true);
    }
  }

  /**
   * Handles the save button click event.
   * It retrieves values from the inputs, saves them, and provides feedback.
   */
  saveButton.addEventListener('click', async () => {
    const domain = domainInput.value.trim();
    const token = tokenInput.value.trim();

    if (!domain || !token) {
      showStatusMessage('Both Domain and Token fields are required.', true);
      return;
    }

    try {
      await saveSettings({ domain, token });
      showStatusMessage('Settings saved successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      showStatusMessage(`Error saving settings: ${message}`, true);
    }
  });

  // Initially load the settings when the page is opened
  loadAndDisplaySettings();
});
