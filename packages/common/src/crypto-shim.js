// This shim ensures that when `email-alias-core` tries to import the Web Crypto API
// from Node.js's 'crypto' module, it gets the browser's implementation instead.
export const webcrypto = globalThis.crypto;
