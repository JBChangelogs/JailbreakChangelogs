"use client";

import { useEffect, useState } from "react";
import {
  fetchItemsClientPage,
  ItemSearchQueryTooShortError,
  searchItemsClientPage,
  type ItemsPage,
  type ItemsPageOptions,
} from "@/utils/api/api";
import type { Item } from "@/types";

export function useItemCatalogPage(
  query: string,
  page = 1,
  enabled = true,
  options: ItemsPageOptions = {},
) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [data, setData] = useState<ItemsPage<Item> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { sort, minValue, maxValue } = options;
  const filterKey = options.filters?.join(",") ?? "";

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setErrorMessage(null);
    setData(null);
    const requestOptions = {
      sort,
      filters: filterKey ? filterKey.split(",") : undefined,
      minValue,
      maxValue,
    };
    const request = debouncedQuery.trim()
      ? searchItemsClientPage(
          debouncedQuery,
          page,
          controller.signal,
          requestOptions,
        )
      : fetchItemsClientPage(page, controller.signal, requestOptions);
    void request
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(true);
          setErrorMessage(
            reason instanceof ItemSearchQueryTooShortError
              ? reason.message
              : null,
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, enabled, page, sort, filterKey, minValue, maxValue]);

  return {
    data: query === debouncedQuery ? data : null,
    loading: loading || query !== debouncedQuery,
    error: query === debouncedQuery && error,
    errorMessage: query === debouncedQuery ? errorMessage : null,
  };
}
