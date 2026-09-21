"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DuplicateVariantsResponse, Item } from "@/types";
import { createLogger } from "@/services/logger";
import {
  INVENTORY_API_SOURCE_HEADER,
  INVENTORY_API_URL,
} from "@/utils/api/api";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import DupeComparisonClient from "./DupeComparisonClient";

const log = createLogger("UI");

interface DupeComparisonLoaderProps {
  id: string;
  itemsData: Item[];
}

export default function DupeComparisonLoader({
  id,
  itemsData,
}: DupeComparisonLoaderProps) {
  const [variants, setVariants] = useState<DuplicateVariantsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadVariants = async () => {
      if (!INVENTORY_API_URL) {
        setLoadError(new Error("Inventory API URL is not configured"));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${INVENTORY_API_URL}/item/duplicates/variants?id=${encodeURIComponent(id)}`,
          {
            headers: { "X-Source": INVENTORY_API_SOURCE_HEADER || "" },
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (response.status === 404) {
          setIsNotFound(true);
          return;
        }

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

        setVariants((await response.json()) as DuplicateVariantsResponse);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error
            ? error
            : new Error("Failed to fetch duplicate variants"),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void loadVariants();
    return () => controller.abort();
  }, [id]);

  if (loadError) throw loadError;

  if (isLoading) {
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

  if (variants) {
    return (
      <DupeComparisonClient
        ogItem={variants.og}
        duplicateItem={variants.duplicate}
        itemsData={itemsData}
      />
    );
  }

  if (!isNotFound) return null;

  return (
    <div className="border-border-card bg-secondary-bg rounded-lg border">
      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div className="bg-secondary-text/10 mt-0.5 shrink-0 rounded-full p-2">
            <Icon
              icon="heroicons:magnifying-glass"
              className="text-secondary-text h-5 w-5"
            />
          </div>
          <div>
            <p className="text-primary-text font-medium">
              Comparison not found
            </p>
            <p className="text-secondary-text mt-0.5 text-sm">
              This duplicate comparison can&apos;t be found.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/dupes">Search Dupes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
