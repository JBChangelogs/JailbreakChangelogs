import type { UserData } from "@/types/auth";
import { safeGetJSON, safeSetJSON } from "@/utils/storage/safeStorage";

export type ExperimentOverrides = Record<string, "treatment" | "control">;

export class ExperimentOverrideRejectedError extends Error {
  constructor(key: string) {
    super(
      `The experiment key “${key}” wasn't accepted. Check the exact key, that it's running, and your tester access.`,
    );
    this.name = "ExperimentOverrideRejectedError";
  }
}

export function validateExperimentOverrides(
  next: ExperimentOverrides,
  previous: ExperimentOverrides,
  assignments: Record<string, string>,
) {
  const rejected = Object.entries(next).find(
    ([key, variant]) =>
      previous[key] !== variant && assignments[key] !== variant,
  );
  if (rejected) throw new ExperimentOverrideRejectedError(rejected[0]);
}

export interface ExperimentsResponse {
  experiments: Record<string, string>;
  descriptions: Record<string, string | null>;
}

export function parseExperimentsResponse(data: unknown): ExperimentsResponse {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The server returned an invalid experiment response.");
  }
  const { experiments, descriptions = {} } = data as Record<string, unknown>;
  if (
    !experiments ||
    typeof experiments !== "object" ||
    Array.isArray(experiments) ||
    Object.values(experiments).some((value) => typeof value !== "string") ||
    !descriptions ||
    typeof descriptions !== "object" ||
    Array.isArray(descriptions) ||
    Object.values(descriptions).some(
      (value) => value !== null && typeof value !== "string",
    )
  ) {
    throw new Error("The server returned an invalid experiment response.");
  }
  return {
    experiments: experiments as Record<string, string>,
    descriptions: descriptions as Record<string, string | null>,
  };
}

export function canOverrideExperiments(user: Pick<UserData, "flags"> | null) {
  return (
    user?.flags?.some(
      ({ flag, enabled }) =>
        (flag === "is_tester" || flag === "is_owner") && enabled === true,
    ) ?? false
  );
}

/** Keeps only valid experiment keys forced to a known variant. */
export function toExperimentOverrides(value: unknown): ExperimentOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([key, variant]) =>
        /^[a-z0-9_]{1,64}$/.test(key) &&
        (variant === "treatment" || variant === "control"),
    ),
  );
}

/**
 * This browser's forced variants for `userId`. They're what X-Experiment
 * sends; with sync on they mirror the synced ones, so the first requests
 * after a reload already carry them.
 */
export function readExperimentOverrides(userId: string): ExperimentOverrides {
  return toExperimentOverrides(
    safeGetJSON<unknown>(`experiment-overrides:${userId}`, null),
  );
}

const OVERRIDES_EVENT = "experimentOverridesChange";

/** Tells this tab that the forced variants or the sync setting changed. */
export function notifyExperimentOverridesChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent?.(new Event(OVERRIDES_EVENT));
  }
}

/** Calls back when forced variants or sync change, in this tab or another. */
export function subscribeExperimentOverrides(callback: () => void) {
  window.addEventListener(OVERRIDES_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(OVERRIDES_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function sameExperimentOverrides(
  a: ExperimentOverrides,
  b: ExperimentOverrides,
) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

export function saveExperimentOverrides(
  userId: string,
  overrides: ExperimentOverrides,
) {
  const saved = safeSetJSON(`experiment-overrides:${userId}`, overrides);
  notifyExperimentOverridesChange();
  return saved;
}

export function serializeExperimentOverrides(overrides: ExperimentOverrides) {
  return Object.entries(overrides)
    .map(([key, variant]) => `${key}=${variant}`)
    .join(",");
}

export function getExperimentHeader() {
  if (typeof window === "undefined") return "";
  const user = safeGetJSON<UserData>("user", null);
  if (!user?.id || !canOverrideExperiments(user)) return "";
  return serializeExperimentOverrides(readExperimentOverrides(user.id));
}
