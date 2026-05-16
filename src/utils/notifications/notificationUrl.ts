/**
 * Utility for parsing and validating notification URLs
 */

export type NotificationUrlInfo =
  | {
      isWhitelisted: false;
    }
  | {
      isWhitelisted: true;
      isJailbreakChangelogs: true;
      relativePath: string;
    }
  | {
      isWhitelisted: true;
      isJailbreakChangelogs: false;
      validatedExternalHref: string;
    };

const INTERNAL_HOSTNAMES = new Set([
  "jailbreakchangelogs.com",
  "www.jailbreakchangelogs.com",
  "jailbreakchangelogs.xyz",
  "www.jailbreakchangelogs.xyz",
]);
const SAFE_PROTOCOLS = new Set(["https:"]);

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
 * parseNotificationUrl("https://inventories.jailbreakchangelogs.com/user/export/123")
 * // => { isWhitelisted: true, isJailbreakChangelogs: false, validatedExternalHref: "https://inventories.jailbreakchangelogs.com/user/export/123" }
 */
export function parseNotificationUrl(link: string): NotificationUrlInfo {
  try {
    const url = new URL(link);
    if (!SAFE_PROTOCOLS.has(url.protocol)) {
      return { isWhitelisted: false };
    }

    // Only treat the main site hostnames as internal navigation
    const isInternalHostname = INTERNAL_HOSTNAMES.has(url.hostname);
    const isWhitelisted =
      isInternalHostname || isJailbreakChangelogsHostname(url.hostname);

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
        validatedExternalHref: url.href,
      };
    }

    return { isWhitelisted: false };
  } catch {
    // Invalid URL
    return { isWhitelisted: false };
  }
}

export function getNotificationActionLabel(
  urlInfo: NotificationUrlInfo,
): string {
  if (!urlInfo.isWhitelisted) {
    return "View";
  }

  if (urlInfo.isJailbreakChangelogs) {
    return urlInfo.relativePath.startsWith("/redeem") ? "Redeem" : "View";
  }

  try {
    const url = new URL(urlInfo.validatedExternalHref);
    return url.pathname === "/redeem" ? "Redeem" : "View";
  } catch {
    return "View";
  }
}
