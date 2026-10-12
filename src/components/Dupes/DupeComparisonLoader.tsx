"use client";

import { useQuery } from "@tanstack/react-query";
import type { DuplicateVariantsResponse } from "@/types";
import { useBatchItems } from "@/hooks/useBatchItems";
import { createLogger } from "@/services/logger";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { Spinner } from "@/components/ui/Spinner";
import DupeComparisonClient from "./DupeComparisonClient";
import DupeComparisonNotFound from "./DupeComparisonNotFound";

const log = createLogger("UI");

interface DupeComparisonLoaderProps {
  id: string;
  reportItem?: { item_id?: number; title: string; categoryTitle?: string };
  originalOwner?: string;
}

export default function DupeComparisonLoader({
  id,
  reportItem,
  originalOwner,
}: DupeComparisonLoaderProps) {
  const variantsQuery = useQuery({
    queryKey: ["duplicate-variants", id],
    queryFn: async ({ signal }): Promise<DuplicateVariantsResponse | null> => {
      if (!INVENTORY_API_URL) {
        throw new Error("Inventory API URL is not configured");
      }
      const response = await fetch(
        `${INVENTORY_API_URL}/item/duplicates/variants?id=${encodeURIComponent(id)}`,
        {
          headers: { "X-Source": INVENTORY_API_SOURCE_HEADER || "" },
          cache: "no-store",
          signal,
        },
      );
      if (response.status === 404) return null;
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        log.error("Failed to fetch duplicate variants", {
          status: response.status,
          body,
        });
        throw new Error(
          `Failed to fetch duplicate variants: ${response.status}`,
        );
      }
      return response.json() as Promise<DuplicateVariantsResponse>;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const variants = variantsQuery.data;
  const itemIds = variants ? [variants.duplicate.item_id] : [];
  const itemQuery = useBatchItems(itemIds);

  if (variantsQuery.error && !variantsQuery.data) throw variantsQuery.error;
  if (itemQuery.error && !itemQuery.data) throw itemQuery.error;

  if (variantsQuery.isPending) {
    return (
      <div className="border-border-card bg-secondary-bg flex min-h-64 items-center justify-center rounded-xl border">
        <div className="text-center">
          <Spinner className="mx-auto h-8 w-8" />
          <p className="text-secondary-text mt-3 text-sm">
            Loading duplicate variants...
          </p>
        </div>
      </div>
    );
  }

  if (variants && itemQuery.isPending) {
    return (
      <div className="border-border-card bg-secondary-bg flex min-h-64 items-center justify-center rounded-xl border">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (variants) {
    return (
      <DupeComparisonClient
        ogItem={variants.og}
        duplicateItem={variants.duplicate}
        itemsData={itemQuery.data ?? []}
      />
    );
  }

  if (!variantsQuery.isSuccess) return null;

  return (
    <DupeComparisonNotFound
      key={id}
      id={id}
      reportItem={reportItem}
      originalOwner={originalOwner}
    />
  );
}
