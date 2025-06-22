# Email Alias Extensions

**A browser extension for Firefox & Chrome that generates secure, verifiable email aliases for your custom domain.**

This project provides a browser extension that allows you to quickly generate unique email aliases on the fly. It is built on top of the [`email-alias-core`](https://github.com/karteekiitg/email-alias-core) library and is designed for users who own a custom domain with a catch-all email address configured.

## Features

- **Secure Alias Generation**: Generate strong, unique email aliases directly in your browser.
- **Tracker-Free Emails**: Designed to work with services like [Cloudflare Workers](#integration-with-cloudflare-workers) to clean email trackers.
- **Cross-Browser Support**: Works seamlessly on Chrome & Firefox.
- **Zero External Dependencies**: Core logic is self-contained for reliability.
- **Easy Storage**: Securely store your secret token and domain in the browser's local storage.
- **Context Menu Integration**: Quickly generate aliases from any webpage.

## Use Cases

1. **Avoid Spam**: Use unique aliases for each service to prevent spam.
2. **Privacy Protection**: Mask your primary email address for enhanced privacy.
3. **Tracker Cleaning**: Integrate with [Cloudflare Workers](#integration-with-cloudflare-workers) to strip email trackers and protect from spam on catch all addresses.

## Project Structure

This repository is a monorepo managed with npm workspaces:

- `packages/common`: Shared TypeScript code for alias generation and storage.
- `packages/chrome`: Chrome extension manifest.
- `packages/firefox`: Firefox extension manifest.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later recommended)
- [npm](https://www.npmjs.com/) (v9 or later)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/karteekiitg/email-alias-extensions.git
   cd email-alias-extensions

   ```

2. Install dependencies:
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

1. Navigate to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `dist/chrome`.

### Firefox

1. Navigate to `about:debugging`.
2. Click **This Firefox** > **Load Temporary Add-on**.
3. Select `dist/firefox/manifest.json`.

## Usage

1. **Configure Settings**:

   - Open the extension's **Options** page.
   - Enter your secret token and domain (e.g., `example.com`).
   - Click **Save**.

> [!CAUTION]
>
> Store your token securely in your password manager. You will need it to validate generated aliases in cloudflare workers. And more importantly if you lose it, you will not be able to validate the aliases generated going forward. You will not stop receiveing emails as such but spam protection on catchall becomes useless. I can't stress this enough, store it securely in your password manager.
>
> For example, if this token leaks its not too bad, the spammer will be able to spam you creating random aliases (not worth the effort unless this is used by millions, which itself is unlikely as one needs a domain to use it, which many wont bother), but if you lose it, you will not be able to validate the aliases generated going forward or maybe even lose the ability to receive emails if its deleted from cloudflare. So you can use a weaker token, but I highly recommend storing it securely in your password manager.

2. **Generate Aliases**:

   - Click the extension icon in the toolbar.
   - Enter a label (e.g., `shopping`) and source (e.g., `amazon.com`).
   - Click **Generate** and copy the alias.

3. **Context Menu**:

   - Right-click on any webpage to generate an alias for the current domain.

4. **Shortcuts**:
   - Use the keyboard shortcuts setup on the options page to directly generate email aliases.

## Integration with Cloudflare Workers

This extension pairs perfectly with a Cloudflare Workers setup to:

- Validate incoming emails.
- Clean email trackers for enhanced privacy (similar to duckduckgo email).
- Forward emails to your primary address.
- Eliminate spam even when using catchall addresses.

Note: Alternately, you can use any service that supports custom domains and catch-all addresses (like protonmail, etc), but you'd lose the email cleaning and the eliminate spam features (as the incoming emails are not screened at entry point).

**TODO**: Add link to Cloudflare Workers repo once available.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss the changes.

## License

This project is licensed under the [MIT License](LICENSE).
