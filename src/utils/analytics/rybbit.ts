"use client";

import type { FilterSort, ValueSort } from "@/types";
import {
  getDesktopNavigation,
  subscribeDesktopNavigation,
  type DesktopNavigation,
} from "@/utils/ui/desktopNavigation";

export type FilterSortEventContext = "values" | "trading";
export type FilterSortEventKind = "filter" | "sort";

type FilterSortEventValue = FilterSort | ValueSort | string;

type EventNameMap = Record<
  FilterSortEventContext,
  Record<FilterSortEventKind, string>
>;

const EVENT_NAMES: EventNameMap = {
  values: {
    filter: "Values Filter Change",
    sort: "Values Sort Change",
  },
  trading: {
    filter: "Trading Filter Change",
    sort: "Trading Sort Change",
  },
};

export function trackEvent(
  name: string,
  properties?: Record<string, string | number | boolean>,
) {
  if (
    typeof window === "undefined" ||
    !window.rybbit ||
    typeof window.rybbit.event !== "function"
  )
    return;
  window.rybbit.event(name, properties);
}

export function trackDesktopNavigationUsage() {
  const largeScreen = window.matchMedia("(min-width: 1536px)");
  const recorded = new Set<DesktopNavigation>();
  const track = () => {
    if (!largeScreen.matches || typeof window.rybbit?.event !== "function")
      return;
    const layout = getDesktopNavigation();
    if (recorded.has(layout)) return;
    trackEvent(
      layout === "sidebar"
        ? "Sidebar Navigation Used"
        : "Top Bar Navigation Used",
    );
    recorded.add(layout);
  };

  const unsubscribe = subscribeDesktopNavigation(track);
  largeScreen.addEventListener("change", track);
  // The analytics script may finish loading after the header mounts.
  document.addEventListener("load", track, true);
  track();
  return () => {
    unsubscribe();
    largeScreen.removeEventListener("change", track);
    document.removeEventListener("load", track, true);
  };
}

export function trackIdentify(
  userId: string,
  traits?: Record<string, unknown>,
) {
  if (
    typeof window === "undefined" ||
    !window.rybbit ||
    typeof window.rybbit.identify !== "function"
  )
    return;
  window.rybbit.identify(userId, traits);
}

export function trackClearUserId() {
  if (
    typeof window === "undefined" ||
    !window.rybbit ||
    typeof window.rybbit.clearUserId !== "function"
  )
    return;
  window.rybbit.clearUserId();
}

export function trackFilterSortEvent(
  context: FilterSortEventContext,
  kind: FilterSortEventKind,
  value: FilterSortEventValue,
) {
  const eventName = EVENT_NAMES[context][kind];
  const payloadKey = kind === "filter" ? "filter" : "sort";
  trackEvent(eventName, { [payloadKey]: value });
}
