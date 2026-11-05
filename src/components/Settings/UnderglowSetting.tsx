"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import SupporterModal from "@/components/Modals/SupporterModal";
import { ColorSwatch } from "@/components/ui/color-picker";
import { Switch } from "@/components/ui/switch";
import { appearanceProfileKey } from "@/hooks/useAccentColor";
import { useDebounce } from "@/hooks/useDebounce";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import { saveUnderglow } from "@/services/settingsService";
import type { UserData } from "@/types/auth";
import { fetchUserById, PUBLIC_API_URL } from "@/utils/api/api";
import { accentColorToHex } from "@/utils/ui/accentColor";

const DEFAULT_COLOR = "#7fff00";

export function UnderglowSetting({ userData }: { userData: UserData }) {
  const queryClient = useQueryClient();
  const profileKey = appearanceProfileKey(userData.id);
  const { data: profile } = useQuery({
    queryKey: profileKey,
    queryFn: () =>
      fetchUserById(userData.id, PUBLIC_API_URL) as Promise<{
        underglow?: number | string | null;
      }>,
    staleTime: 60_000,
  });
  const saved = accentColorToHex(profile?.underglow);
  const { modalState, closeModal, checkAccentColorAccess } =
    useSupporterModal();
  const canEdit = () => checkAccentColorAccess(userData.premiumtype ?? 0);

  // Picks save after the picker settles, like the accent color.
  const [draft, setDraft] = useState<string | null>(null);
  const debounced = useDebounce(draft, 600);
  const save = async (color: string | null) => {
    try {
      await saveUnderglow(color);
      queryClient.setQueryData<Record<string, unknown>>(profileKey, (data) =>
        data ? { ...data, underglow: color } : data,
      );
    } catch (error) {
      toast.error("Couldn't save underglow", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDraft((current) => (current === color ? null : current));
    }
  };
  useEffect(() => {
    if (debounced && debounced !== saved) void save(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const color = draft ?? saved;
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label
            htmlFor="underglow-toggle"
            className="text-primary-text text-base font-medium"
          >
            Underglow
          </label>
          <p className="text-secondary-text text-sm">
            A soft colored glow under your profile cards.
          </p>
        </div>
        <Switch
          id="underglow-toggle"
          checked={!!color}
          onCheckedChange={(on) => {
            if (!on) {
              setDraft(null);
              void save(null);
            } else if (canEdit()) setDraft(DEFAULT_COLOR);
          }}
        />
      </div>
      {color && (
        <div
          className="underglow w-fit rounded-xl"
          style={{ "--underglow": color } as CSSProperties}
        >
          <ColorSwatch
            label="Color"
            value={color}
            onChange={setDraft}
            canOpen={canEdit}
          />
        </div>
      )}
      <SupporterModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        feature={modalState.feature}
        currentTier={modalState.currentTier}
        requiredTier={modalState.requiredTier}
        currentLimit={modalState.currentLimit}
        requiredLimit={modalState.requiredLimit}
      />
    </div>
  );
}
