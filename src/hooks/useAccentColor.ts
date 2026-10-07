"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchAccentColor, saveAccentColor } from "@/services/settingsService";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { accentColorToHex } from "@/utils/ui/accentColor";

/** Query key for the public profile the appearance settings read from. */
export const appearanceProfileKey = (userId: string) =>
  ["appearance-profile", userId] as const;

/**
 * The user's profile accent color for the settings page. `accent` is what the
 * profile shows right now (a picked-but-unsaved color, the custom color, or
 * Discord's); `customAccent` is only the custom one. Picks save after the
 * picker settles, to stay under the API's rate limit.
 */
export function useAccentColor(userId: string | undefined) {
  const queryClient = useQueryClient();
  const profileKey = appearanceProfileKey(userId ?? "");
  const { data: profile } = useQuery({
    queryKey: profileKey,
    queryFn: () =>
      fetchUserById(userId!, PUBLIC_API_URL) as Promise<{
        accent_color?: number | string | null;
      }>,
    enabled: !!userId,
    staleTime: 60_000,
  });

  const accentKey = ["accent-color", userId] as const;
  const { data: customAccent = null } = useQuery({
    queryKey: accentKey,
    queryFn: fetchAccentColor,
    enabled: !!userId,
    staleTime: 60_000,
  });

  const [draft, setDraft] = useState<string | null>(null);
  const debouncedDraft = useDebounce(draft, 600);

  useEffect(() => {
    if (!debouncedDraft || debouncedDraft === customAccent) return;
    saveAccentColor(debouncedDraft)
      .then(() => {
        queryClient.setQueryData(accentKey, debouncedDraft);
        queryClient.setQueryData<Record<string, unknown>>(
          profileKey,
          (current) =>
            current ? { ...current, accent_color: debouncedDraft } : current,
        );
      })
      .catch((error: unknown) => {
        toast.error("Couldn't save accent color", {
          description: error instanceof Error ? error.message : undefined,
        });
      })
      .finally(() => setDraft(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);

  const reset = async () => {
    try {
      await saveAccentColor(null);
      setDraft(null);
      queryClient.setQueryData(accentKey, null);
      // The effective color falls back to Discord's; reload it.
      await queryClient.invalidateQueries({ queryKey: profileKey });
      toast.success("Accent color reset to your Discord color");
    } catch (error) {
      toast.error("Couldn't reset accent color", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return {
    accent: draft ?? customAccent ?? accentColorToHex(profile?.accent_color),
    customAccent,
    setAccent: setDraft,
    reset,
  };
}
