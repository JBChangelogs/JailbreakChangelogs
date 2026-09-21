const _cache: Record<string, unknown> = {};
let _hasSynced = false;

export function replacePreferencesCache(prefs: Record<string, unknown>): void {
  for (const key of Object.keys(_cache)) delete _cache[key];
  Object.assign(_cache, prefs);
  _hasSynced = true;
}

export function setCachedPreference(key: string, value: unknown): void {
  _cache[key] = value;
}

export function deleteCachedPreference(key: string): void {
  delete _cache[key];
}

export function getCachedPreference(key: string): unknown {
  return _cache[key];
}

export function hasSyncedPreferences(): boolean {
  return _hasSynced;
}

export function markPreferencesUnsynced(): void {
  _hasSynced = false;
}

export function getCachedPreferenceKeys(): string[] {
  return Object.keys(_cache);
}

export function clearPreferencesCache(): void {
  for (const key of Object.keys(_cache)) delete _cache[key];
  _hasSynced = false;
}
