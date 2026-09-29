"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPartialItems } from "@/utils/api/api";

export function usePartialItems(enabled = true) {
  return useQuery({
    queryKey: ["items-partial"],
    queryFn: ({ signal }) => fetchPartialItems(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
