"use client";

import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchItemsBatch } from "@/utils/api/api";
import type { Item } from "@/types";

const STALE_TIME = 5 * 60 * 1000;
const GC_TIME = 30 * 60 * 1000;

// null marks an id the API didn't return, so it isn't requested again
const ITEM_KEY_PREFIX = ["items-batch-item"] as const;
const itemKey = (id: number) => [...ITEM_KEY_PREFIX, id] as const;

export function useBatchItems(itemIds: number[], enabled = true) {
  const queryClient = useQueryClient();
  const ids = useMemo(
    () =>
      Array.from(new Set(itemIds.filter(Number.isInteger))).sort(
        (a, b) => a - b,
      ),
    [itemIds],
  );
  const missingIds = ids.filter((id) => {
    const state = queryClient.getQueryState<Item | null>(itemKey(id));
    return (
      state?.data === undefined || Date.now() - state.dataUpdatedAt > STALE_TIME
    );
  });

  const query = useQuery({
    queryKey: ["items-batch", missingIds],
    queryFn: async ({ signal }) => {
      const items = await fetchItemsBatch(missingIds, signal);
      const returned = new Map(items.map((item) => [item.id, item]));
      queryClient.setQueryDefaults(ITEM_KEY_PREFIX, { gcTime: GC_TIME });
      missingIds.forEach((id) => {
        queryClient.setQueryData<Item | null>(
          itemKey(id),
          returned.get(id) ?? null,
        );
      });
      return items;
    },
    enabled: enabled && missingIds.length > 0,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
  });

  const data = useMemo(() => {
    const fetched = new Map(query.data?.map((item) => [item.id, item]));
    return ids
      .map(
        (id) =>
          fetched.get(id) ?? queryClient.getQueryData<Item | null>(itemKey(id)),
      )
      .filter((item): item is Item => item != null);
  }, [ids, queryClient, query.data]);

  return {
    data: enabled && ids.length > 0 ? data : undefined,
    isPending: enabled && missingIds.length > 0 && query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
