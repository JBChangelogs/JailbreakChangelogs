export function getJbclToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)jbcl_token=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    return token && token !== "undefined" ? token : null;
  } catch {
    return null;
  }
}
