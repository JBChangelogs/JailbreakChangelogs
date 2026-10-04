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

export function readExperimentOverrides(userId: string): ExperimentOverrides {
  const stored = safeGetJSON<unknown>(`experiment-overrides:${userId}`, null);
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
  return Object.fromEntries(
    Object.entries(stored).filter(
      ([key, variant]) =>
        /^[a-z0-9_]{1,64}$/.test(key) &&
        (variant === "treatment" || variant === "control"),
    ),
  );
}

export function saveExperimentOverrides(
  userId: string,
  overrides: ExperimentOverrides,
) {
  return safeSetJSON(`experiment-overrides:${userId}`, overrides);
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
