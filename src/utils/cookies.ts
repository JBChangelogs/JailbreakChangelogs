/**
 * Cookie utility functions for managing authentication tokens
 */

const COOKIE_OPTIONS = {
  maxAge: 2592000, // 30 days in seconds
  path: "/",
  sameSite: "Lax" as const,
  secure: true,
};

/**
 * Sets a cookie with standard options
 * @param name - Cookie name
 * @param value - Cookie value
 */
export function setCookie(name: string, value: string): void {
  const options = [
    `${name}=${value}`,
    `max-age=${COOKIE_OPTIONS.maxAge}`,
    `path=${COOKIE_OPTIONS.path}`,
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
    COOKIE_OPTIONS.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  document.cookie = options;
}

/**
 * Gets a cookie value by name (only works for non-HttpOnly cookies)
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || null
  );
}

/**
 * Checks if a token cookie exists and is valid
 * NOTE: This function is deprecated because the token cookie is HttpOnly.
 * Use the session API or auth context instead.
 * @returns true if token exists and is not 'undefined'
 * @deprecated Use session API or auth context for authentication checks
 */
export function hasValidToken(): boolean {
  // Token cookie is HttpOnly, so we can't access it from client-side
  // This function always returns false to prevent false positives
  return false;
}

/**
 * Removes a cookie by name
 * @param name - Cookie name
 */
export function removeCookie(name: string): void {
  document.cookie = `${name}=; max-age=0; path=/`;
}
