"use client";

import { useEffect, useState } from "react";
import {
  fetchItemsClientPage,
  searchItemsClientPage,
  type ItemsPage,
} from "@/utils/api/api";
import type { Item } from "@/types";

export function useItemCatalogPage(query: string, page = 1, enabled = true) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [data, setData] = useState<ItemsPage<Item> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

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
      ? searchItemsClientPage(debouncedQuery, page, controller.signal)
      : fetchItemsClientPage(page, controller.signal);
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
  }, [debouncedQuery, enabled, page]);

  return {
    data: query === debouncedQuery ? data : null,
    loading: loading || query !== debouncedQuery,
    error,
  };
}
