

// This shim ensures that when `email-alias-core` tries to import the Web Crypto API
// from Node.js's 'crypto' module, it gets the browser's implementation instead.
export const webcrypto = globalThis.crypto || {
  subtle: {
    digest: () => Promise.reject(new Error('Web Crypto API not available')),
    encrypt: () => Promise.reject(new Error('Web Crypto API not available')),
    decrypt: () => Promise.reject(new Error('Web Crypto API not available')),
    sign: () => Promise.reject(new Error('Web Crypto API not available')),
    verify: () => Promise.reject(new Error('Web Crypto API not available')),
    deriveKey: () => Promise.reject(new Error('Web Crypto API not available')),
    generateKey: () => Promise.reject(new Error('Web Crypto API not available')),
    importKey: () => Promise.reject(new Error('Web Crypto API not available')),
    exportKey: () => Promise.reject(new Error('Web Crypto API not available')),
  },
  getRandomValues: (array) => {
    throw new Error('Web Crypto API not available');
  },
};
