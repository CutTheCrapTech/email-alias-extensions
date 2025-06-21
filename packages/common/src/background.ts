import browser from 'webextension-polyfill';

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
    browser.runtime.openOptionsPage();
  }
});
