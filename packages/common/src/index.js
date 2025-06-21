
/// <reference types="firefox-webext-browser" />
import { generateEmailAlias as coreGenerateEmailAlias } from 'email-alias-core';

const EMAIL_ALIAS_TOKEN_KEY = 'email-alias-token';
const DOMAIN_KEY = 'email-alias-domain';

/**
 * Throws an error if the WebExtension API is not available.
 */
function ensureBrowserAPI() {
  if (typeof browser === 'undefined' || !browser.storage?.local) {
    throw new Error('WebExtension API (browser.storage.local) is not available.');
  }
}

/**
 * Securely stores the token.
 * @param {string} token - The token to store.
 * @throws {Error} If token is empty or browser API is unavailable.
 */
async function storeToken(token) {
  ensureBrowserAPI();
  await browser.storage.local.set({ [EMAIL_ALIAS_TOKEN_KEY]: token });
}

/**
 * Retrieves the stored token.
 * @returns {Promise<string|null>} The stored token, or null if not found.
 * @throws {Error} If browser API is unavailable.
 */
export async function getToken() {
  ensureBrowserAPI();
  const result = await browser.storage.local.get(EMAIL_ALIAS_TOKEN_KEY);
  return result[EMAIL_ALIAS_TOKEN_KEY] || null;
}

/**
 * Securely stores the domain.
 * @param {string} domain - The domain to store.
 * @throws {Error} If domain is empty or browser API is unavailable.
 */
async function storeDomain(domain) {
  ensureBrowserAPI();
  await browser.storage.local.set({ [DOMAIN_KEY]: domain });
}

/**
 * Retrieves the stored domain.
 * @returns {Promise<string|null>} The stored domain, or null if not found.
 * @throws {Error} If browser API is unavailable.
 */
export async function getDomain() {
  ensureBrowserAPI();
  const result = await browser.storage.local.get(DOMAIN_KEY);
  return result[DOMAIN_KEY] || null;
}

/**
 * Generates a valid email alias given a prefix.
 * @param {string} prefix - The prefix for the email alias.
 * @returns {Promise<string>} The generated email alias.
 * @throws {Error} If token/domain not set or browser API is unavailable.
 */
export async function generateEmailAlias(prefix) {
  const token = await getToken();
  const domain = await getDomain();

  if (!token) {
    throw new Error('Authentication token is not set. Please configure it in the extension settings.');
  }
  if (!domain) {
    throw new Error('Domain is not set. Please configure it in the extension settings.');
  }

  return coreGenerateEmailAlias({
    secretKey: token,
    aliasParts: [prefix],
    domain,
  });
}

/**
 * Saves the token with validation.
 * @param {string} token - The token to save.
 * @throws {Error} If token is empty or browser API is unavailable.
 */
export async function saveToken(token) {
  if (!token || token.trim().length === 0) {
    throw new Error('Token cannot be empty.');
  }
  await storeToken(token);
}

/**
 * Saves the domain with validation.
 * @param {string} domain - The domain to save.
 * @throws {Error} If domain is empty or browser API is unavailable.
 */
export async function saveDomain(domain) {
  if (!domain || domain.trim().length === 0) {
    throw new Error('Domain cannot be empty.');
  }
  await storeDomain(domain);
}
