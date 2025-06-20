# Email Alias Extensions

**A browser extension for Firefox & Chrome that generates secure, verifiable email aliases for your custom domain.**

This project provides a browser extension that allows you to quickly generate unique email aliases on the fly. It is built on top of the [`email-alias-core`](https://github.com/karteekiitg/email-alias-core) library and is designed for users who own a custom domain with a catch-all email address configured.

## Features

- Generate strong, unique email aliases directly in your browser.
- Securely store your secret token using the browser's local storage.
- Simple, intuitive interface for quick alias generation.
- Cross-browser support (Chrome & Firefox).
- Zero external runtime dependencies for the core logic.

## Project Structure

This repository is a monorepo managed with npm workspaces.

- `packages/common`: Shared TypeScript code used by both extensions, including the core logic for alias generation and storage.
- `packages/chrome`: Contains the manifest, UI files (`popup.html`, `popup.js`), and build script specific to the Chrome extension.
- `packages/firefox`: Contains the manifest and build script specific to the Firefox extension. It reuses UI assets from the `chrome` package to avoid code duplication.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later is recommended)
- [npm](https://www.npmjs.com/) (v9 or later)

### Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/karteekiitg/email-alias-extensions.git
    cd email-alias-extensions
    ```

2.  **Install dependencies:**
    This command installs dependencies for all packages in the monorepo from the root directory.
    ```bash
    npm install
    ```

### Build

To build the extensions for both Chrome and Firefox, run the following command from the root of the project:

```bash
npm run build
```

This will create a `dist` directory inside `packages/chrome` and `packages/firefox`, containing the unpacked extension files ready for installation.

For active development, you can use the watch command to automatically rebuild the extensions whenever you make changes to the source files:

```bash
npm run watch
```

## Installation

After building the extension, you can load it into your browser for development and testing.

### Chrome

1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** using the toggle switch in the top-right corner.
3.  Click the **Load unpacked** button.
4.  Select the `email-alias-extensions/packages/chrome/dist` directory.

### Firefox

1.  Open Firefox and navigate to `about:debugging`.
2.  Click on the **This Firefox** tab in the sidebar.
3.  Click the **Load Temporary Add-on...** button.
4.  Navigate to the `email-alias-extensions/packages/firefox/dist` directory and select the `manifest.json` file.

## How to Use

1.  Click on the extension icon in your browser's toolbar to open the popup.
2.  In the **Settings** section, enter your secret token (or password) and click **Save**. This token is what you'll use to generate aliases and is stored securely in your browser's local storage.
3.  In the generator section at the top, enter a prefix for the alias. This is typically the name of the website you're signing up for (e.g., `github.com`).
4.  Click **Generate**.
5.  The generated alias will appear below. Click the **Copy** button to copy it to your clipboard. You can now use this alias to sign up for services.
