import browser from 'webextension-polyfill';

// Define message types
interface OpenOptionsMessage {
  action: 'openOptionsPage';
}

interface ShowAliasDialogMessage {
  action: 'showAliasDialog';
  targetElementInfo: {
    frameId: number;
  };
}

type ExtensionMessage = OpenOptionsMessage | ShowAliasDialogMessage;

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

  // Create context menu item for generating aliases
  void browser.contextMenus.create({
    id: 'fill-email-alias',
    title: 'Fill with generated email alias',
    contexts: ['editable'],
    documentUrlPatterns: ['http://*/*', 'https://*/*'],
  });
});

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'fill-email-alias' && tab?.id) {
    // Send message to content script to show alias generation dialog
    void browser.tabs.sendMessage(tab.id, {
      action: 'showAliasDialog',
      targetElementInfo: {
        frameId: info.frameId || 0,
      },
    } as ShowAliasDialogMessage);
  }
});

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
browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) {
    sendResponse({ success: false, error: 'Invalid message format' });
    return true;
  }

  if (message.action === 'openOptionsPage') {
    void browser.runtime.openOptionsPage();
    sendResponse({ success: true });
  }

  // Return true to indicate we will send a response
  return true;
});
