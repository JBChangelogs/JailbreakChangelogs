"use client";

import { useEffect, useState } from "react";
import {
  fetchItemsClientPage,
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
  const { sort, type, minValue, maxValue } = options;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setData(null);
    const request = debouncedQuery.trim()
      ? searchItemsClientPage(debouncedQuery, page, controller.signal, {
          sort,
          type,
          minValue,
          maxValue,
        })
      : fetchItemsClientPage(page, controller.signal, {
          sort,
          type,
          minValue,
          maxValue,
        });
    void request
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, enabled, page, sort, type, minValue, maxValue]);

  return {
    data: query === debouncedQuery ? data : null,
    loading: loading || query !== debouncedQuery,
    error,
  };
}
