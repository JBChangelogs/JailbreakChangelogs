"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPartialItems, type PartialItem } from "@/utils/api/api";

export function usePartialItemFields<T extends { id: number }>(
  fields: readonly (keyof T & string)[],
  enabled = true,
) {
  return useQuery({
    queryKey: ["items-partial", fields.join(",")],
    queryFn: ({ signal }) => fetchPartialItems<T>(fields, signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export type CatalogValues = {
  id: number;
  cash_value: string | null;
  duped_value: string | null;
  demand: string | null;
  trend: string | null;
  is_limited: number | null;
  is_seasonal: number | null;
  tradable: number;
};
const CATALOG_VALUE_FIELDS = [
  "cash_value",
  "duped_value",
  "demand",
  "trend",
  "is_limited",
  "is_seasonal",
  "tradable",
] as const;

export function useCatalogValues(enabled = true) {
  return usePartialItemFields<CatalogValues>(CATALOG_VALUE_FIELDS, enabled);
}

const NAME_TYPE_FIELDS = ["name", "type"] as const;

export function usePartialItems(enabled = true) {
  return usePartialItemFields<PartialItem>(NAME_TYPE_FIELDS, enabled);
}
