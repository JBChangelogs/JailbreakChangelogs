"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { FilterSort } from "@/types";
import type { FilterGroup } from "@/components/Values/valuesFilterOptions";
import { fetchItemFilterGroups } from "@/utils/api/api";

const EMPTY_FILTER_GROUPS: Awaited<ReturnType<typeof fetchItemFilterGroups>> =
  [];
// Status and Type stay local: they render as chips/type groups with their own
// labels and icons, so only these groups come from the API.
const ADVANCED_GROUPS = new Set(["Demand", "Trend"]);

export function useAdvancedFilterGroups(): FilterGroup[] {
  const { data = EMPTY_FILTER_GROUPS } = useQuery({
    queryKey: ["item-filter-groups"],
    queryFn: ({ signal }) => fetchItemFilterGroups(signal),
    staleTime: 60 * 60 * 1000,
  });
  return useMemo(
    () =>
      data
        .filter((group) => ADVANCED_GROUPS.has(group.group))
        .map((group) => ({
          label: group.group,
          options: group.filters.map((filter) => ({
            value: filter.value as FilterSort,
            label: filter.label,
          })),
        })),
    [data],
  );
}
