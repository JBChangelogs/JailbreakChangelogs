"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { searchDupeItemsByOwner } from "@/utils/api/api";
import { getCategoryIcon, getCategoryColor } from "@/utils/items/categoryIcons";
import type { DupeItemSearchResult } from "@/types";

interface DupeOwnerItemSearchProps {
  ownerId: string;
  ownerDisplayName?: string;
}

const MIN_QUERY_LENGTH = 1;
const RESULTS_LIMIT = 25;
const SEARCH_DEBOUNCE_MS = 300;

export default function DupeOwnerItemSearch({
  ownerId,
  ownerDisplayName,
}: DupeOwnerItemSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DupeItemSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const latestRequestIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);

  const cancelPendingFetch = useCallback(() => {
    if (fetchTimeoutIdRef.current) {
      clearTimeout(fetchTimeoutIdRef.current);
      fetchTimeoutIdRef.current = null;
    }
    activeAbortControllerRef.current?.abort();
  }, []);

  useEffect(() => {
    const prefix = query.trim();
    cancelPendingFetch();

    if (prefix.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    latestRequestIdRef.current += 1;
    const requestId = latestRequestIdRef.current;

    setIsLoading(true);

    fetchTimeoutIdRef.current = setTimeout(async () => {
      try {
        const data = await searchDupeItemsByOwner(
          ownerId,
          prefix,
          RESULTS_LIMIT,
          controller.signal,
        );
        if (
          controller.signal.aborted ||
          latestRequestIdRef.current !== requestId
        )
          return;
        setResults(data);
      } catch {
        if (
          controller.signal.aborted ||
          latestRequestIdRef.current !== requestId
        )
          return;
        setResults([]);
      } finally {
        if (
          !controller.signal.aborted &&
          latestRequestIdRef.current === requestId
        ) {
          setIsLoading(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);
  }, [query, ownerId, cancelPendingFetch]);

  useEffect(() => {
    return () => cancelPendingFetch();
  }, [cancelPendingFetch]);

  const showPanel = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <div className="border-border-card mx-auto max-w-7xl border-t pt-6">
      <h3 className="text-primary-text text-lg font-bold">
        Search {ownerDisplayName || "this player"}&apos;s Duped Items
      </h3>
      <p className="text-secondary-text mt-1 mb-4 text-sm">
        Look up other items already flagged as duped under this owner.
      </p>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search item name..."
          className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-lg border px-4 py-2.5 pr-16 transition-all duration-300 focus:outline-none"
        />

        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-secondary-text hover:text-primary-text cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" className="h-5 w-5" />
            </button>
          )}

          {query && (
            <div className="border-primary-text h-6 border-l opacity-30"></div>
          )}

          <Icon
            icon="heroicons:magnifying-glass"
            className="text-link h-5 w-5"
          />
        </div>

        {showPanel && (
          <ul className="border-border-card bg-secondary-bg absolute top-full left-0 z-10 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border shadow-lg">
            {isLoading ? (
              <li className="text-secondary-text flex items-center gap-2 px-4 py-3 text-sm">
                <Spinner className="h-4 w-4" />
                Searching...
              </li>
            ) : results.length === 0 ? (
              <li className="text-secondary-text px-4 py-3 text-sm">
                No duped items found matching &quot;{query.trim()}&quot;
              </li>
            ) : (
              results.map((item) => {
                const categoryIcon = getCategoryIcon(item.type);
                return (
                  <li key={item.id}>
                    <Link
                      href={`/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`}
                      prefetch={false}
                      className="bg-tertiary-bg hover:bg-quaternary-bg flex items-center gap-3 px-4 py-2.5 transition-colors"
                    >
                      <div className="bg-quaternary-bg flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full">
                        {categoryIcon ? (
                          <categoryIcon.Icon
                            className="h-4 w-4"
                            style={{ color: getCategoryColor(item.type) }}
                          />
                        ) : (
                          <Icon
                            icon="heroicons:cube"
                            className="text-secondary-text h-4 w-4"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-primary-text truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-secondary-text truncate text-xs">
                          {item.type}
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
