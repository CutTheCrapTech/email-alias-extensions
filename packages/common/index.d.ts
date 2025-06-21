/**
 * Retrieves the stored token.
 * @returns The stored token, or null if not found.
 */
export declare function getToken(): Promise<string | null>;
/**
 * Retrieves the stored domain.
 * @returns The stored domain, or null if not found.
 */
export declare function getDomain(): Promise<string | null>;
/**
 * Generates a valid email alias given a prefix.
 * It retrieves the stored token and domain and uses them for generation.
 * @param prefix The prefix for the email alias (e.g., a website name).
 * @returns The generated email alias.
 * @throws If the token or domain is not set.
 */
export declare function generateEmailAlias(prefix: string): Promise<string>;
/**
 * Saves the token. A validation step could be added here if needed.
 * @param token The token to save.
 */
export declare function saveToken(token: string): Promise<void>;
/**
 * Saves the domain. A validation step could be added here if needed.
 * @param domain The domain to save.
 */
export declare function saveDomain(domain: string): Promise<void>;
