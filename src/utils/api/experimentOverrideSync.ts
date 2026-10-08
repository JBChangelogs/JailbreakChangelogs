import { getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import {
  notifyExperimentOverridesChange,
  toExperimentOverrides,
  type ExperimentOverrides,
} from "@/utils/api/experiments";
import { safeGetJSON, safeSetJSON } from "@/utils/storage/safeStorage";

/**
 * Synced forced variants live in the user's realtime preferences, one
 * `experiment_override:<key>` preference per experiment. Every other
 * preference belongs to another feature and is left alone.
 */
export const OVERRIDE_PREFERENCE_PREFIX = "experiment_override:";
const SYNC_KEY = "experiment_overrides_sync";
const PREFERENCES_PATH = "/v2/users/me/realtime-preferences";

/** Whether this browser syncs forced variants. Each browser opts in itself. */
export function isOverrideSyncEnabled() {
  return safeGetJSON<boolean>(SYNC_KEY, false) === true;
}

export function setOverrideSyncEnabled(enabled: boolean) {
  safeSetJSON(SYNC_KEY, enabled);
  notifyExperimentOverridesChange();
}

/** The forced variants among a user's realtime preferences. */
export function overridesFromPreferences(
  preferences: Record<string, unknown>,
): ExperimentOverrides {
  return toExperimentOverrides(
    Object.fromEntries(
      Object.entries(preferences)
        .filter(([key]) => key.startsWith(OVERRIDE_PREFERENCE_PREFIX))
        .map(([key, value]) => [
          key.slice(OVERRIDE_PREFERENCE_PREFIX.length),
          value,
        ]),
    ),
  );
}

async function preferencesRequest(path: string, init?: RequestInit) {
  const { url, headers } = buildApiFetchRequest(
    process.env.NEXT_PUBLIC_API_URL,
    path,
  );
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { ...headers, ...init?.headers },
  });
  if (!response.ok) {
    throw new Error(
      await getResponseErrorMessage(
        response,
        "Unable to sync experiment overrides.",
      ),
    );
  }
  return response;
}

export async function fetchSyncedOverrides(): Promise<ExperimentOverrides> {
  const response = await preferencesRequest(PREFERENCES_PATH);
  const data = (await response.json()) as { preferences?: unknown };
  return data.preferences &&
    typeof data.preferences === "object" &&
    !Array.isArray(data.preferences)
    ? overridesFromPreferences(data.preferences as Record<string, unknown>)
    : {};
}

/**
 * Applies this browser's change, from `previous` to `next`, on top of the
 * server's forced variants. Keys this browser hasn't seen yet (added on
 * another device) are kept rather than deleted as stale.
 */
export function mergeOverrideChanges(
  server: ExperimentOverrides,
  previous: ExperimentOverrides,
  next: ExperimentOverrides,
): ExperimentOverrides {
  const merged = { ...server };
  for (const key of Object.keys(previous)) {
    if (!(key in next)) delete merged[key];
  }
  for (const [key, variant] of Object.entries(next)) {
    if (previous[key] !== variant) merged[key] = variant;
  }
  return merged;
}

/**
 * Makes the synced forced variants match `next`, given that they are
 * `current` now. Sets and deletes keys one at a time: deleting all
 * preferences would wipe every other feature's preferences too.
 */
export async function writeSyncedOverrides(
  next: ExperimentOverrides,
  current: ExperimentOverrides,
) {
  // Keys are [a-z0-9_] plus the prefix's colon, all safe in a path.
  const keyPath = (key: string) =>
    `${PREFERENCES_PATH}/${OVERRIDE_PREFERENCE_PREFIX}${key}`;
  await Promise.all([
    ...Object.entries(next)
      .filter(([key, variant]) => current[key] !== variant)
      .map(([key, value]) =>
        preferencesRequest(keyPath(key), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        }),
      ),
    ...Object.keys(current)
      .filter((key) => !(key in next))
      .map((key) => preferencesRequest(keyPath(key), { method: "DELETE" })),
  ]);
}
