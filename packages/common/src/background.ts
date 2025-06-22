import browser from 'webextension-polyfill';

// Define message types
interface OpenOptionsMessage {
  action: 'openOptionsPage';
}

interface ShowAliasDialogMessage {
  type: 'show-alias-dialog';
}

interface EmailFieldsResponse {
  hasEmailFields: boolean;
}

type ExtensionMessage = OpenOptionsMessage;

/**
 * This background script is the extension's event handler.
 * It runs in the background and listens for important browser events.
 */

// Listen for the `onInstalled` event, which fires when the extension is installed,
// updated, or the browser is updated.
browser.runtime.onInstalled.addListener((details) => {
  // The `details` object contains information about the event.
  // We are only interested in the 'install' reason.
  if (details.reason === 'install') {
    console.log('Extension successfully installed. Opening options page...');
    // This is a browser API call that opens the extension's options page.
    // The options page is defined in the `manifest.json` file.
    // We use `void` to explicitly mark the promise as intentionally unhandled.
    void browser.runtime.openOptionsPage();
  }

  // Create context menu item for generating aliases - show on all contexts
  // This allows users to right-click anywhere on a page and access the feature
  void browser.contextMenus.create({
    id: 'generate-email-alias',
    title: 'Generate Email Alias',
    contexts: [
      'page',
      'frame',
      'selection',
      'link',
      'editable',
      'image',
      'video',
      'audio',
    ],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  });
});

function isPingResponse(obj: unknown): obj is { success?: boolean } {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    ('success' in obj ? typeof obj.success === 'boolean' : true)
  );
}

// Helper function to check if content script is available on a tab
async function isContentScriptAvailable(tabId: number): Promise<boolean> {
  try {
    const response: unknown = await browser.tabs.sendMessage(tabId, {
      type: 'ping',
    });

    return isPingResponse(response) && Boolean(response.success);
  } catch {
    return false;
  }
}

// Helper function to inject content script if needed
async function ensureContentScriptLoaded(tabId: number): Promise<boolean> {
  try {
    // First check if it's already loaded
    if (await isContentScriptAvailable(tabId)) {
      return true;
    }

    // Try to inject the content script
    await browser.scripting.executeScript({
      target: { tabId },
      files: ['dialog.js'],
    });

    // Wait a moment for script to initialize
    await new Promise((resolve) => setTimeout(resolve, 100));

    return await isContentScriptAvailable(tabId);
  } catch {
    console.error('Failed to inject content script');
    return false;
  }
}

function isEmailFieldsResponse(obj: unknown): obj is EmailFieldsResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'hasEmailFields' in obj &&
    typeof (obj as EmailFieldsResponse).hasEmailFields === 'boolean'
  );
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'generate-email-alias' && tab?.id !== undefined) {
    const tabId = tab.id;
    void (async () => {
      try {
        // Ensure content script is loaded
        const scriptLoaded = await ensureContentScriptLoaded(tabId);

        if (!scriptLoaded) {
          console.error('Content script could not be loaded on this page');

          // Show a user-friendly notification
          try {
            await browser.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon-48.png', // Adjust path as needed
              title: 'Email Alias Generator',
              message:
                "This page doesn't support the extension. Try refreshing the page or use it on a different website.",
            });
          } catch {
            console.error('Failed to show notification');
          }
          return;
        }

        // Check if the page has email fields (optional check)
        try {
          const response: unknown = await browser.tabs.sendMessage(tabId, {
            type: 'check-email-fields',
          });

          if (isEmailFieldsResponse(response)) {
            console.log('Email fields check:', response);
          } else {
            console.log('Unexpected response format');
          }

          console.log('Email fields check:', response);
        } catch {
          console.log('Could not check for email fields');
        }

        // Show the dialog - it will handle cases where no email fields exist
        // by copying to clipboard instead
        await browser.tabs.sendMessage(tabId, {
          type: 'show-alias-dialog',
        } as ShowAliasDialogMessage);
      } catch {
        console.error('Failed to communicate with content script');

        // Show a user-friendly notification
        try {
          await browser.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-48.png', // Adjust path as needed
            title: 'Email Alias Generator',
            message:
              'Could not access this page. Please refresh and try again, or use the extension on a different website.',
          });
        } catch {
          console.error('Failed to show notification');
        }
      }
    })();
  }
});

// Define response types
interface SuccessResponse {
  success: true;
}

interface ErrorResponse {
  success: false;
  error: string;
}

type MessageResponse = SuccessResponse | ErrorResponse;

// Define ping message type
interface PingMessage {
  type: 'ping';
}

// Type guard for ping message
function isPingMessage(message: unknown): message is PingMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'ping'
  );
}

// Type guard to check if message is a valid ExtensionMessage
function isExtensionMessage(message: unknown): message is ExtensionMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'action' in message &&
    typeof (message as { action: unknown }).action === 'string'
  );
}

// Handle messages from popup/content scripts
browser.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender,
    sendResponse: (response: MessageResponse) => void
  ) => {
    // Handle ping messages for content script availability check
    if (isPingMessage(message)) {
      sendResponse({ success: true });
      return true; // Indicate we handled the message
    }

    if (!isExtensionMessage(message)) {
      sendResponse({ success: false, error: 'Invalid message format' });
      return true; // Indicate we handled the message
    }

    if (message.action === 'openOptionsPage') {
      void browser.runtime.openOptionsPage();
      sendResponse({ success: true });
      return true; // Indicate we handled the message
    }

    // Unknown message
    sendResponse({ success: false, error: 'Unknown action' });
    return true; // Indicate we handled the message
  }
);
