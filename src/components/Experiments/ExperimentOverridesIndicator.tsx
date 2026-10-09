"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getExperimentIndicatorPlacement,
  syncExperimentIndicatorPlacement,
} from "@/utils/ui/experimentIndicator";
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

  useEffect(() => {
    if (!userId) return;
    return syncExperimentIndicatorPlacement();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    // Set once a realtime update arrives, so an older REST response that
    // lands afterwards can't overwrite it.
    let realtimeSeen = false;
    const update = (
      change: (overrides: ExperimentOverrides) => ExperimentOverrides,
    ) => {
      if (!isOverrideSyncEnabled()) return;
      saveExperimentOverrides(userId, change(readExperimentOverrides(userId)));
    };

    /** The event's preference key, if it's one of ours. */
    const overrideKey = (event: Event) => {
      const key = (event as CustomEvent<{ key?: unknown } | null>).detail?.key;
      return typeof key === "string" &&
        key.startsWith(OVERRIDE_PREFERENCE_PREFIX)
        ? key
        : null;
    };

    const onSet = (event: Event) => {
      const key = overrideKey(event);
      if (!key) return;
      realtimeSeen = true;
      const { value } = (event as CustomEvent<{ value?: unknown }>).detail;
      const experiment = key.slice(OVERRIDE_PREFERENCE_PREFIX.length);
      update((overrides) => {
        const next = { ...overrides };
        delete next[experiment];
        return { ...next, ...overridesFromPreferences({ [key]: value }) };
      });
    };
    const onDelete = (event: Event) => {
      const key = overrideKey(event);
      if (!key) return;
      realtimeSeen = true;
      update((overrides) => {
        const next = { ...overrides };
        delete next[key.slice(OVERRIDE_PREFERENCE_PREFIX.length)];
        return next;
      });
    };
    // A full snapshot (on connect, or after a clear) replaces the copy.
    const onSnapshot = (event: Event) => {
      realtimeSeen = true;
      update(() =>
        overridesFromPreferences(
          (event as CustomEvent<Record<string, unknown>>).detail ?? {},
        ),
      );
    };

    window.addEventListener("realtimePreference", onSet);
    window.addEventListener("realtimePreferenceDeleted", onDelete);
    window.addEventListener("realtimePreferences", onSnapshot);
    // Load over REST too, for when the socket is slow or not connected.
    if (isOverrideSyncEnabled()) {
      fetchSyncedOverrides()
        .then((overrides) => {
          if (!realtimeSeen) update(() => overrides);
        })
        .catch(() => {});
    }
    return () => {
      window.removeEventListener("realtimePreference", onSet);
      window.removeEventListener("realtimePreferenceDeleted", onDelete);
      window.removeEventListener("realtimePreferences", onSnapshot);
    };
  }, [userId]);

  return <ExperimentOverridesBadge placement="floating" />;
}

/** Display only; the site-wide indicator keeps syncing even when hidden. */
export function ExperimentOverridesBadge({
  placement,
}: {
  placement: "floating" | "header";
}) {
  const { user } = useAuthContext();
  const userId = user && canOverrideExperiments(user) ? user.id : null;
  const summary = useSyncExternalStore(
    subscribeExperimentOverrides,
    () =>
      userId
        ? `${Object.keys(readExperimentOverrides(userId)).length}:${isOverrideSyncEnabled()}:${getExperimentIndicatorPlacement()}`
        : "0:false:floating",
    () => "0:false:floating",
  );
  const [count, synced, selectedPlacement] = summary.split(":");
  if (count === "0" || placement !== selectedPlacement) return null;
  const label = `${count} experiment${count === "1" ? "" : "s"} forced · ${synced === "true" ? "synced" : "this browser"}`;
  const badge = (
    <Link
      href="/experiments"
      aria-label={label}
      className={
        placement === "floating"
          ? "border-status-warning/40 bg-secondary-bg/90 text-primary-text hover:border-status-warning focus-visible:ring-border-focus fixed bottom-4 left-[calc(var(--desktop-sidebar-width,0px)+1rem)] z-40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-[left,border-color] duration-300 ease-in-out focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none"
          : "text-status-warning hover:bg-quaternary-bg focus-visible:ring-link flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none xl:h-10 xl:w-10"
      }
    >
      <FlaskConical
        aria-hidden="true"
        className="text-status-warning size-3.5"
      />
      {placement === "floating" && label}
    </Link>
  );
  return placement === "header" ? (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  ) : (
    badge
  );
}
