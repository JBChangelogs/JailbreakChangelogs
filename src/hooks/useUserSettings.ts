"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserSettings } from "@/services/settingsService";

export function useUserSettings(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-settings", userId],
    queryFn: fetchUserSettings,
    enabled: Boolean(userId),
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
