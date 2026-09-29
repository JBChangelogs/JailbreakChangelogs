"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchItemsBatch } from "@/utils/api/api";

export function useBatchItems(itemIds: number[], enabled = true) {
  const ids = useMemo(
    () =>
      Array.from(new Set(itemIds.filter(Number.isInteger))).sort(
        (a, b) => a - b,
      ),
    [itemIds],
  );
  return useQuery({
    queryKey: ["items-batch", ids],
    queryFn: ({ signal }) => fetchItemsBatch(ids, signal),
    enabled: enabled && ids.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
