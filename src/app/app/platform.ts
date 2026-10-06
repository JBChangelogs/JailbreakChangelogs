export function detectDownloadPlatform(
  userAgent: string,
  platform?: string,
  maxTouchPoints = 0,
): "Windows" | "Linux" | "macOS" | "Mobile" | null {
  if (
    /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(userAgent) ||
    platform === "Android" ||
    platform === "iOS" ||
    (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)
  )
    return "Mobile";
  if (/CrOS/i.test(userAgent)) return null;
  if (platform)
    return platform === "Windows" ||
      platform === "Linux" ||
      platform === "macOS"
      ? platform
      : null;
  if (/Windows NT|Win32|Win64/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS";
  return null;
}

export function getBrowserDownloadPlatform() {
  const browser = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  return detectDownloadPlatform(
    browser.userAgent,
    browser.userAgentData?.platform,
    browser.maxTouchPoints,
  );
}
