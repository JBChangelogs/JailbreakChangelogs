/**
 * Utility for parsing and validating notification URLs
 */

export interface NotificationUrlInfo {
  isWhitelisted: boolean;
  isJailbreakChangelogs?: boolean;
  relativePath?: string;
  href?: string;
}

const INTERNAL_HOSTNAMES = new Set([
  "jailbreakchangelogs.com",
  "www.jailbreakchangelogs.com",
  // Legacy domain kept for old notifications
  "jailbreakchangelogs.xyz",
  "www.jailbreakchangelogs.xyz",
]);

function isJailbreakChangelogsHostname(hostname: string) {
  return (
    hostname === "jailbreakchangelogs.com" ||
    hostname.endsWith(".jailbreakchangelogs.com") ||
    hostname === "jailbreakchangelogs.xyz" ||
    hostname.endsWith(".jailbreakchangelogs.xyz")
  );
}
/**
 * Parses a notification link URL and determines how it should be handled
 *
 * @param link - The notification link URL to parse
 * @returns Information about the URL including whether it's whitelisted and how to handle it
 *
 * @example
 * // Main domain - returns relative path for internal navigation
 * parseNotificationUrl("https://jailbreakchangelogs.com/values")
 * // => { isWhitelisted: true, isJailbreakChangelogs: true, relativePath: "/values" }
 *
 * @example
 * // Subdomain - returns full URL for external navigation
 * parseNotificationUrl("https://inventories.jailbreakchangelogs.xyz/user/export/123")
 * // => { isWhitelisted: true, isJailbreakChangelogs: false, href: "https://inventories.jailbreakchangelogs.xyz/user/export/123" }
 */
export function parseNotificationUrl(link: string): NotificationUrlInfo {
  try {
    const url = new URL(link);

    // Only treat the main site hostnames as internal navigation
    const isInternalHostname = INTERNAL_HOSTNAMES.has(url.hostname);
    const isWhitelisted =
      isInternalHostname ||
      isJailbreakChangelogsHostname(url.hostname) ||
      url.hostname === "google.com" ||
      url.hostname.endsWith(".google.com");

    if (isInternalHostname) {
      // Extract relative path for internal navigation
      const relativePath = url.pathname + url.search + url.hash;
      return {
        isWhitelisted: true,
        isJailbreakChangelogs: true,
        relativePath,
      };
    } else if (isWhitelisted) {
      // Treat subdomains and other whitelisted domains as external
      return {
        isWhitelisted: true,
        isJailbreakChangelogs: false,
        href: link,
      };
    }

    return { isWhitelisted: false };
  } catch {
    // Invalid URL
    return { isWhitelisted: false };
  }
}
