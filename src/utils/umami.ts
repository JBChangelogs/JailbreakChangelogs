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

export function trackFilterSortEvent(
  context: FilterSortEventContext,
  kind: FilterSortEventKind,
  value: FilterSortEventValue,
) {
  if (typeof window === "undefined" || !window.umami) return;

  const eventName = EVENT_NAMES[context][kind];
  const payloadKey = kind === "filter" ? "filter" : "sort";
  window.umami.track(eventName, { [payloadKey]: value });
}
