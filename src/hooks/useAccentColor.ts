"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchAccentColor, saveAccentColor } from "@/services/settingsService";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { accentColorToHex, type Accent } from "@/utils/ui/accentColor";

const sameAccent = (a: Accent, b: Accent | null) =>
  a.color === b?.color && a.gradient === b.gradient && a.style === b.style;

const discordAccent = (
  color: number | string | null | undefined,
): Accent | null => {
  const hex = accentColorToHex(color);
  return hex ? { color: hex, gradient: null, style: "solid" } : null;
};

/** Query key for the public profile the appearance settings read from. */
export const appearanceProfileKey = (userId: string) =>
  ["appearance-profile", userId] as const;

/**
 * The user's profile card accent for the settings page. `accent` is what the
 * profile shows right now (a picked-but-unsaved accent, the custom one, or
 * Discord's color); `customAccent` is only the custom one. Picks save after
 * the picker settles, to stay under the API's rate limit.
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

  const [draft, setDraft] = useState<Accent | null>(null);
  const debouncedDraft = useDebounce(draft, 600);

  // Saves and resets run one at a time so an older one can't land after a
  // newer one. Tasks handle their own errors so the queue keeps going.
  const saveQueue = useRef(Promise.resolve());
  const pending = useRef(0);
  const enqueue = (task: () => Promise<void>) => {
    pending.current++;
    saveQueue.current = saveQueue.current.then(task).finally(() => {
      pending.current--;
    });
    return saveQueue.current;
  };

  useEffect(() => {
    const value = debouncedDraft;
    // While a save is pending, the saved color may still change, so a pick
    // matching it needs its own write.
    if (!value || (pending.current === 0 && sameAccent(value, customAccent))) {
      return;
    }
    void enqueue(() =>
      saveAccentColor(value)
        .then(() => {
          queryClient.setQueryData(accentKey, value);
          queryClient.setQueryData<Record<string, unknown>>(
            profileKey,
            (current) =>
              current
                ? {
                    ...current,
                    accent_color: value.color,
                    accent_gradient: value.gradient,
                    accent_style: value.style,
                  }
                : current,
          );
        })
        .catch((error: unknown) => {
          toast.error("Couldn't save accent color", {
            description: error instanceof Error ? error.message : undefined,
          });
        })
        // Keep a newer pick that is still waiting to save.
        .finally(() =>
          setDraft((current) => (current === value ? null : current)),
        ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDraft]);

  const reset = () =>
    enqueue(async () => {
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
    });

  return {
    accent: draft ?? customAccent ?? discordAccent(profile?.accent_color),
    customAccent,
    setAccent: setDraft,
    reset,
  };
}
