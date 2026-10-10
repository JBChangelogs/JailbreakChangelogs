"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const NetworthCapHistoryChart = dynamic(
  () => import("@/components/Inventory/NetworthCapHistoryChart"),
  {
    loading: () => (
      <div className="border-border-card bg-secondary-bg mb-8 rounded-lg border p-4">
        <Skeleton className="mb-4 h-6 w-48" />
        <Skeleton className="h-75 w-full rounded-none" />
      </div>
    ),
    ssr: false,
  },
);

export const CategoryPieCard = dynamic(
  () => import("@/components/Inventory/Breakdown/CategoryPieCard"),
  {
    loading: () => (
      <div className="inventory-breakdown-sticky-card border-border-card bg-secondary-bg rounded-lg border p-4">
        <Skeleton className="mx-auto mb-2 h-5 w-40" />
        <Skeleton className="mx-auto aspect-square max-h-90 w-full max-w-90 rounded-full" />
      </div>
    ),
    ssr: false,
  },
);
