"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { fetchAccentColor, saveAccentColor } from "@/services/settingsService";
import {
  accentColorToHex,
  toAccentStyle,
  type Accent,
} from "@/utils/ui/accentColor";

const sameAccent = (a: Accent, b: Accent | null) =>
  a.color === b?.color && a.gradient === b.gradient && a.style === b.style;

export const appearanceProfileKey = (userId: string) =>
  ["appearance-profile", userId] as const;

export function useAccentColor(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuthContext();
  const color = accentColorToHex(
    user?.id === userId ? user?.accent_color : null,
  );

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
        .then(async () => {
          queryClient.setQueryData(accentKey, value);
          await refreshUser();
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
        await refreshUser();
        toast.success("Accent color reset to your Discord color");
      } catch (error) {
        toast.error("Couldn't reset accent color", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
    });

  return {
    accent:
      draft ??
      customAccent ??
      (color
        ? {
            color,
            gradient: accentColorToHex(user?.accent_gradient),
            style: toAccentStyle(user?.accent_style),
          }
        : null),
    customAccent,
    setAccent: setDraft,
    reset,
  };
}
