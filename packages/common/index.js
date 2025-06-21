/// <reference types="firefox-webext-browser" />
import { generateEmailAlias as coreGenerateEmailAlias } from 'email-alias-core';
const EMAIL_ALIAS_TOKEN_KEY = 'email-alias-token';
const DOMAIN_KEY = 'email-alias-domain';
/**
 * Securely stores the token.
 * @param token The token to store.
 */
async function storeToken(token) {
    // NOTE: `browser.storage.local` is the standard WebExtension API for storage.
    // It works in both Chrome (as `chrome.storage.local`) and Firefox.
    // A polyfill or separate builds might be needed to handle the `browser` vs `chrome` namespace.
    await browser.storage.local.set({ [EMAIL_ALIAS_TOKEN_KEY]: token });
}
/**
 * Retrieves the stored token.
 * @returns The stored token, or null if not found.
 */
export async function getToken() {
    const result = await browser.storage.local.get(EMAIL_ALIAS_TOKEN_KEY);
    return result[EMAIL_ALIAS_TOKEN_KEY] || null;
}
/**
 * Securely stores the domain.
 * @param domain The domain to store.
 */
async function storeDomain(domain) {
    await browser.storage.local.set({ [DOMAIN_KEY]: domain });
}
/**
 * Retrieves the stored domain.
 * @returns The stored domain, or null if not found.
 */
export async function getDomain() {
    const result = await browser.storage.local.get(DOMAIN_KEY);
    return result[DOMAIN_KEY] || null;
}
/**
 * Generates a valid email alias given a prefix.
 * It retrieves the stored token and domain and uses them for generation.
 * @param prefix The prefix for the email alias (e.g., a website name).
 * @returns The generated email alias.
 * @throws If the token or domain is not set.
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
    const alias = await coreGenerateEmailAlias({
        secretKey: token,
        aliasParts: [prefix],
        domain,
    });
    return alias;
}
/**
 * Saves the token. A validation step could be added here if needed.
 * @param token The token to save.
 */
export async function saveToken(token) {
    if (!token || token.trim().length === 0) {
        throw new Error('Token cannot be empty.');
    }
    await storeToken(token);
}
/**
 * Saves the domain. A validation step could be added here if needed.
 * @param domain The domain to save.
 */
export async function saveDomain(domain) {
    if (!domain || domain.trim().length === 0) {
        throw new Error('Domain cannot be empty.');
    }
    await storeDomain(domain);
}
