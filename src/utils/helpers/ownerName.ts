// Some Roblox accounts set their display name to "none", which reads as a
// missing user, so fall back to the username for those.
type NamedUser = { name?: string; displayName?: string };

const isPlaceholderName = (displayName?: string) =>
  displayName?.trim().toLowerCase() === "none";

/** Applied where Roblox users are fetched, so every page shows the fallback. */
export function withUsernameFallback<T>(user: T): T {
  const named = user as NamedUser | null;
  return named &&
    typeof named === "object" &&
    named.name &&
    isPlaceholderName(named.displayName)
    ? ({ ...named, displayName: named.name } as T)
    : user;
}

export function withUsernameFallbacks<T>(
  users: Record<string, T>,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(users).map(([id, user]) => [id, withUsernameFallback(user)]),
  );
}
