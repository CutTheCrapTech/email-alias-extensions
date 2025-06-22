/**
 * Keyboard shortcut recording functionality for browser extensions.
 * Handles the UI and logic for recording, formatting, and managing keyboard shortcuts.
 */

export interface ShortcutElements {
  input: HTMLInputElement;
  recordButton: HTMLButtonElement;
  clearButton: HTMLButtonElement;
}

export class ShortcutRecorder {
  private isRecording = false;
  private currentRecordingInput: HTMLInputElement | null = null;
  private currentRecordingButton: HTMLButtonElement | null = null;
  private allRecordButtons: HTMLButtonElement[] = [];

  constructor() {
    this.setupGlobalEventListeners();
  }

  /**
   * Registers a shortcut input group (input field, record button, clear button)
   * @param elements The DOM elements for this shortcut
   */
  registerShortcut(elements: ShortcutElements): void {
    const { input, recordButton, clearButton } = elements;

    // Store reference to all record buttons for state management
    this.allRecordButtons.push(recordButton);

    // Set up event listeners
    recordButton.addEventListener('click', () => {
      this.startRecording(input, recordButton);
    });

    clearButton.addEventListener('click', () => {
      input.value = '';
      this.stopRecording();
    });
  }

  /**
   * Formats a keyboard event into a readable shortcut string
   * @param event The keyboard event to format
   * @returns Formatted shortcut string (e.g., "Ctrl+Alt+K")
   */
  private formatShortcut(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');

    // Only add the key if it's not a modifier
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      parts.push(event.key.length === 1 ? event.key.toUpperCase() : event.key);
    }

    return parts.join('+');
  }

  /**
   * Handles keyboard events during shortcut recording
   * @param event The keyboard event
   */
  private handleShortcutRecording = (event: KeyboardEvent): void => {
    if (!this.isRecording || !this.currentRecordingInput) return;

    event.preventDefault();
    event.stopPropagation();

    // Require at least one modifier key
    if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey) {
      return;
    }

    const shortcut = this.formatShortcut(event);
    if (shortcut && !shortcut.endsWith('+')) {
      this.currentRecordingInput.value = shortcut;
      this.stopRecording();
    }
  };

  /**
   * Starts recording a keyboard shortcut
   * @param inputElement The input field to populate with the shortcut
   * @param buttonElement The button that was clicked to start recording
   */
  private startRecording(
    inputElement: HTMLInputElement,
    buttonElement: HTMLButtonElement
  ): void {
    // Stop any existing recording
    if (this.isRecording) this.stopRecording();

    this.isRecording = true;
    this.currentRecordingInput = inputElement;
    this.currentRecordingButton = buttonElement;

    // Update UI state
    inputElement.value = 'Press keys...';
    inputElement.classList.add('recording');
    buttonElement.textContent = 'Recording...';
    buttonElement.disabled = true;

    // Start listening for keyboard events
    document.addEventListener('keydown', this.handleShortcutRecording, true);
  }

  /**
   * Stops recording a keyboard shortcut and resets UI state
   */
  private stopRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    document.removeEventListener('keydown', this.handleShortcutRecording, true);

    // Reset input state
    if (this.currentRecordingInput) {
      this.currentRecordingInput.classList.remove('recording');
      if (this.currentRecordingInput.value === 'Press keys...') {
        this.currentRecordingInput.value = '';
      }
    }

    // Reset all record buttons to their default state
    this.allRecordButtons.forEach((button) => {
      button.textContent = 'Set Shortcut';
      button.disabled = false;
    });

    // Clear references
    this.currentRecordingInput = null;
    this.currentRecordingButton = null;
  }

  /**
   * Sets up global event listeners for canceling recording
   */
  private setupGlobalEventListeners(): void {
    // Stop recording when clicking outside shortcut containers
    document.addEventListener('click', (event) => {
      if (
        this.isRecording &&
        event.target &&
        event.target instanceof Element &&
        !event.target.closest('.shortcut-input-container')
      ) {
        this.stopRecording();
      }
    });

    // Stop recording on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isRecording) {
        this.stopRecording();
      }
    });
  }

  /**
   * Checks if currently recording a shortcut
   * @returns True if recording is in progress
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Manually stops any ongoing recording (useful for cleanup)
   */
  forceStopRecording(): void {
    this.stopRecording();
  }
}
