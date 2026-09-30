"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchItemsClientPage,
  ItemSearchQueryTooShortError,
  searchItemsClientPage,
  type ItemsPageOptions,
} from "@/utils/api/api";

export function useItemCatalogPage(
  query: string,
  page = 1,
  enabled = true,
  options: ItemsPageOptions = {},
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const { sort, minValue, maxValue } = options;
  const filterKey = options.filters?.join(",") ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  const catalogQuery = useQuery({
    queryKey: [
      "item-catalog-page",
      debouncedQuery.trim(),
      page,
      sort,
      filterKey,
      minValue,
      maxValue,
    ],
    queryFn: ({ signal }) => {
      const requestOptions = {
        sort,
        filters: filterKey ? filterKey.split(",") : undefined,
        minValue,
        maxValue,
      };
      return debouncedQuery.trim()
        ? searchItemsClientPage(debouncedQuery, page, signal, requestOptions)
        : fetchItemsClientPage(page, signal, requestOptions);
    },
    enabled,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const waitingForDebounce = query !== debouncedQuery;

  return {
    data: waitingForDebounce ? null : (catalogQuery.data ?? null),
    loading: enabled && (waitingForDebounce || catalogQuery.isPending),
    error: !waitingForDebounce && catalogQuery.isError && !catalogQuery.data,
    errorMessage:
      !waitingForDebounce &&
      !catalogQuery.data &&
      catalogQuery.error instanceof ItemSearchQueryTooShortError
        ? catalogQuery.error.message
        : null,
  };
}
