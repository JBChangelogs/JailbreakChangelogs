const _cache: Record<string, unknown> = {};

export function updatePreferencesCache(prefs: Record<string, unknown>): void {
  Object.assign(_cache, prefs);
}

export function setCachedPreference(key: string, value: unknown): void {
  _cache[key] = value;
}

export function getCachedPreference(key: string): unknown {
  return _cache[key];
}
