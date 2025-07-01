import { generateEmailAlias } from "./api";

/**
 * A custom error class to identify errors specific to the API module.
 * This helps in providing targeted feedback to the user in the UI.
 */
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Gets the default label for alias generation.
 * @returns The default label string
 */
export async function getDefaultLabel(): Promise<string> {
  return "marketing";
}

/**
 * Extracts domain name from the current active tab URL for use as source.
 * @returns The domain name or a default value
 */
export function extractDomainForSource(): string {
  // Since we're in a service worker context, we can't directly access the current tab
  // This function should be called with the tab URL passed as parameter
  // For now, return a default value
  return "website";
}

/**
 * Generates an email alias for use in background scripts.
 * This is a simplified version that uses default values.
 * @returns Promise that resolves to the generated email alias
 */
export async function generateAliasForBackground(): Promise<string> {
  try {
    const defaultLabel = await getDefaultLabel();
    const domain = extractDomainForSource();

    return await generateEmailAlias([defaultLabel, domain]);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    throw new ApiError("Failed to generate alias");
  }
}

/**
 * Enhanced version that takes tab URL for better source extraction.
 * @param tabUrl The URL of the current tab
 * @returns Promise that resolves to the generated email alias
 */
export async function generateAliasForBackgroundWithUrl(
  tabUrl?: string,
): Promise<string> {
  try {
    const defaultLabel = await getDefaultLabel();
    let domain = "website";

    if (tabUrl) {
      try {
        const url = new URL(tabUrl);
        // Handle file:// URLs and other protocols without hostnames
        if (url.hostname) {
          domain = url.hostname.replace(/^www\./, "");
        } else {
          domain = "website";
        }
      } catch {
        domain = "website";
      }
    }

    return await generateEmailAlias([defaultLabel, domain]);
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(error.message);
    }
    throw new ApiError("Failed to generate alias");
  }
}
