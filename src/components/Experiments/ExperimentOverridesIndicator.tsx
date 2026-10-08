"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  fetchSyncedOverrides,
  isOverrideSyncEnabled,
  OVERRIDE_PREFERENCE_PREFIX,
  overridesFromPreferences,
} from "@/utils/api/experimentOverrideSync";
import {
  canOverrideExperiments,
  readExperimentOverrides,
  saveExperimentOverrides,
  subscribeExperimentOverrides,
  type ExperimentOverrides,
} from "@/utils/api/experiments";

/**
 * Mounted inside .site-layout so it can sit beside the desktop sidebar,
 * whose width is --desktop-sidebar-width there.
 *
 * A site-wide reminder that experiments are forced, linking to the
 * experiments page. While sync is on it also keeps this browser's copy of the
 * synced forced variants current, since that copy is what X-Experiment sends.
 */
export function ExperimentOverridesIndicator() {
  const { user } = useAuthContext();
  const userId = user && canOverrideExperiments(user) ? user.id : null;

  const summary = useSyncExternalStore(
    subscribeExperimentOverrides,
    () =>
      userId
        ? `${Object.keys(readExperimentOverrides(userId)).length}:${isOverrideSyncEnabled()}`
        : "0:false",
    () => "0:false",
  );
  const [count, synced] = summary.split(":");

  useEffect(() => {
    if (!userId) return;
    const update = (
      change: (overrides: ExperimentOverrides) => ExperimentOverrides,
    ) => {
      if (!isOverrideSyncEnabled()) return;
      saveExperimentOverrides(userId, change(readExperimentOverrides(userId)));
    };

    const onSet = (event: Event) => {
      const { key, value } = (
        event as CustomEvent<{ key: string; value: unknown }>
      ).detail;
      if (!key.startsWith(OVERRIDE_PREFERENCE_PREFIX)) return;
      const experiment = key.slice(OVERRIDE_PREFERENCE_PREFIX.length);
      update((overrides) => {
        const next = { ...overrides };
        delete next[experiment];
        return { ...next, ...overridesFromPreferences({ [key]: value }) };
      });
    };
    const onDelete = (event: Event) => {
      const { key } = (event as CustomEvent<{ key: string }>).detail;
      if (!key.startsWith(OVERRIDE_PREFERENCE_PREFIX)) return;
      update((overrides) => {
        const next = { ...overrides };
        delete next[key.slice(OVERRIDE_PREFERENCE_PREFIX.length)];
        return next;
      });
    };
    // A full snapshot (on connect, or after a clear) replaces the copy.
    const onSnapshot = (event: Event) =>
      update(() =>
        overridesFromPreferences(
          (event as CustomEvent<Record<string, unknown>>).detail ?? {},
        ),
      );

    window.addEventListener("realtimePreference", onSet);
    window.addEventListener("realtimePreferenceDeleted", onDelete);
    window.addEventListener("realtimePreferences", onSnapshot);
    // Load over REST too, for when the socket is slow or not connected.
    if (isOverrideSyncEnabled()) {
      fetchSyncedOverrides()
        .then((overrides) => update(() => overrides))
        .catch(() => {});
    }
    return () => {
      window.removeEventListener("realtimePreference", onSet);
      window.removeEventListener("realtimePreferenceDeleted", onDelete);
      window.removeEventListener("realtimePreferences", onSnapshot);
    };
  }, [userId]);

  if (count === "0") return null;
  return (
    <Link
      href="/experiments"
      className="border-status-warning/40 bg-secondary-bg/90 text-primary-text hover:border-status-warning focus-visible:ring-border-focus fixed bottom-4 left-[calc(var(--desktop-sidebar-width,0px)+1rem)] z-40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-[left,border-color] duration-300 ease-in-out focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
    >
      <FlaskConical
        aria-hidden="true"
        className="text-status-warning size-3.5"
      />
      {count} experiment{count === "1" ? "" : "s"} forced ·{" "}
      {synced === "true" ? "synced" : "this browser"}
    </Link>
  );
}
