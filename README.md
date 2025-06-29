# Email Alias Extensions

**A browser extension for Firefox & Chrome that generates secure, verifiable email aliases for your custom domain.**

This project provides a browser extension that allows you to quickly generate unique email aliases on the fly. It is built on top of the [`email-alias-core`](https://github.com/karteekiitg/email-alias-core) library and is designed for users who own a custom domain with a catch-all email address configured.

## Features

- **Secure Alias Generation**: Generate strong, unique email aliases directly in your browser.
- **Resilient & Recoverable**: Uses the "Key Ring Model" so that losing a key is not a catastrophic event.
- **Tracker-Free Emails**: Designed to work with services like [Cloudflare Workers](#integration-with-cloudflare-workers) to clean email trackers.
- **Cross-Browser Support**: Works seamlessly on Chrome & Firefox.
- **Guided Setup**: An easy-to-use options page helps you generate and back up your secret key.
- **Context Menu & Shortcuts**: Quickly generate aliases from any webpage or with a keyboard shortcut.

## Security and Recovery: The "Key Ring Model"

This extension uses a **"Key Ring Model"** to provide a balance of high security and user-friendly recovery.

- **Your Worker is the Key Ring**: The Cloudflare Worker is designed to hold multiple secret keys (e.g., `SECRET_1`, `SECRET_2`). It can cryptographically validate incoming emails against any key on its ring.
- **Your Extension Holds One Key**: The browser extension only ever stores one "active" key at a time, which it uses to generate new aliases.
- **Graceful Recovery**: If you ever lose the key stored in your browser (e.g., by clearing your browser data or moving to a new computer and you haven't backed up your key to a password manager), **your old aliases will continue to work perfectly**. To recover and continue to be able to generate new aliases, you simply use the extension's "Generate New Key" feature and add the new key to your Worker's configuration (and your password manager, please don't lose it this time). This makes recovery a minor inconvenience, not a catastrophic failure.

### What Happens If I Lose My Key?

- **You WILL NOT lose emails.** Aliases generated with old keys will still be validated by the worker and delivered to your inbox.
- **To fix it:** Go to the extension's Options page, generate a new key, and add it as a new secret variable to your Cloudflare Worker deployment.

### What Happens If a Key is Stolen?

- **The Risk**: If an attacker steals a key, they can generate aliases that your worker will see as valid, potentially sending you sophisticated spam/phishing emails.
- **The Solution**: This is why it is **critical** to store your keys securely in a password manager. If you suspect a key is compromised, you should immediately **deactivate it**. To do this, simply remove the compromised secret from your Worker's environment variables in the Cloudflare dashboard. The change will take effect automatically without needing to change any code. **All** emails generated with that **deactivated key** will no longer be delivered, protecting you from the attacker.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later recommended)
- [npm](https://www.npmjs.com/) (v9 or later)

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/karteekiitg/email-alias-extensions.git
    cd email-alias-extensions
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### Build

To build the extensions for Chrome and Firefox:

```bash
npm run build
```

For development with live reloading:

```bash
npm run watch
```

## Browser Installation

### Chrome

1.  Navigate to `chrome://extensions`.
2.  Enable **Developer mode**.
3.  Click **Load unpacked** and select `dist/chrome`.

### Firefox

1.  Navigate to `about:debugging`.
2.  Click **This Firefox** > **Load Temporary Add-on**.
3.  Select `dist/firefox/manifest.json`.

## Usage

1.  **Configure Settings**:

    - Open the extension's **Options** page.
    - Enter your domain (e.g., `example.com`).
    - Click **"Generate New Key"**.
    - **CRITICAL:** Use the provided buttons to copy the key and save it immediately to a secure password manager (like Bitwarden or 1Password).
    - Check the box confirming you have backed up the key.
    - Click **Save**.

2.  **Deploy to Cloudflare**:

    - Add the generated key as a new secret variable to your Cloudflare Worker's configuration (e.g., `SECRET_1`, `SECRET_2`).
    - Deploy your worker.

3.  **Generate Aliases**:

    - Click the extension icon in the toolbar.
    - Enter a label (e.g., `shopping`) and source (e.g., `amazon.com`).
    - Click **Generate** and copy the alias.

4.  **Context Menu**:

    - Right-click on any webpage to generate an alias for the current domain.

5.  **Shortcuts**:
    - Use the keyboard shortcuts setup on the options page to directly generate email aliases.

## Integration with Cloudflare Workers

This extension pairs perfectly with a Cloudflare Workers setup to:

- Validate incoming emails against your "Key Ring".
- Clean email trackers for enhanced privacy.
- Forward emails to your primary address.
- Eliminate spam even when using catch-all addresses.

**TODO**: Add link to Cloudflare Workers repo once available.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss the changes.

## License

This project is licensed under the [MIT License](LICENSE).
