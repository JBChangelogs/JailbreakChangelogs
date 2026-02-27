interface ValidationResult {
  isValid: boolean;
  message?: string;
}

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

const ALLOWED_RULES_HOSTS = [
  "roblox.com",
  "jailbreakchangelogs.xyz",
  "discord.com",
  "discord.gg",
];

export const SERVER_LINK_ERROR_MESSAGE =
  "Server link must start with: https://www.roblox.com/share?code=";

export const SERVER_RULES_LINK_ERROR_MESSAGE =
  "Server rules contain an unsafe link. Only Roblox, Discord, and JailbreakChangelogs links are allowed.";

const trimTrailingUrlPunctuation = (url: string): string => {
  return url.replace(/[),.;!?]+$/g, "");
};

const extractUrls = (text: string): string[] => {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];
  return matches.map(trimTrailingUrlPunctuation);
};

const isAllowedHostname = (hostname: string, allowedHosts: string[]): boolean =>
  allowedHosts.some(
    (allowedHost) =>
      hostname === allowedHost || hostname.endsWith(`.${allowedHost}`),
  );

export function validatePrivateServerLink(link: string): ValidationResult {
  const trimmed = link.trim();
  if (!trimmed) {
    return { isValid: false, message: "Please enter a server link" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, message: SERVER_LINK_ERROR_MESSAGE };
  }

  const code = parsed.searchParams.get("code");
  const isValidRobloxShareLink =
    parsed.protocol === "https:" &&
    parsed.hostname === "www.roblox.com" &&
    parsed.pathname === "/share" &&
    Boolean(code);

  if (!isValidRobloxShareLink) {
    return { isValid: false, message: SERVER_LINK_ERROR_MESSAGE };
  }

  return { isValid: true };
}

export function validateServerRulesText(rules: string): ValidationResult {
  const urls = extractUrls(rules);

  for (const url of urls) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return { isValid: false, message: SERVER_RULES_LINK_ERROR_MESSAGE };
    }

    const hasSafeHost = isAllowedHostname(parsed.hostname, ALLOWED_RULES_HOSTS);
    if (!hasSafeHost) {
      return { isValid: false, message: SERVER_RULES_LINK_ERROR_MESSAGE };
    }
  }

  return { isValid: true };
}
