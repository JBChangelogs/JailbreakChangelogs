"use client";

import type { FilterSort, ValueSort } from "@/types";

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
