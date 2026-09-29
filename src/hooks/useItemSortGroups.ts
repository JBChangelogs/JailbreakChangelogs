"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchItemSortGroups } from "@/utils/api/api";

const EMPTY_SORT_GROUPS: Awaited<ReturnType<typeof fetchItemSortGroups>> = [];

export function useItemSortGroups() {
  const { data = EMPTY_SORT_GROUPS } = useQuery({
    queryKey: ["item-sort-groups"],
    queryFn: ({ signal }) => fetchItemSortGroups(signal),
    staleTime: 60 * 60 * 1000,
  });
  return useMemo(
    () => data.map((group) => ({ label: group.group, options: group.sorts })),
    [data],
  );
}
