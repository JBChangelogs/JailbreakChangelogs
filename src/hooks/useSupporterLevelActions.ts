"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { SupporterHistoryEntry, UserData } from "@/types/auth";
import { revertSupporterLevel } from "@/services/settingsService";
import { safeSetJSON } from "@/utils/storage/safeStorage";

interface UseSupporterLevelActionsOptions {
  userData: UserData | null;
  setSupporterHistory: Dispatch<SetStateAction<SupporterHistoryEntry[]>>;
}

export function useSupporterLevelActions({
  userData,
  setSupporterHistory,
}: UseSupporterLevelActionsOptions) {
  const [revertingSupporterLevel, setRevertingSupporterLevel] = useState<
    number | null
  >(null);

  const handleSupporterLevelUpdate = async (level: number) => {
    if (!userData) {
      return;
    }

    setRevertingSupporterLevel(level);
    try {
      await revertSupporterLevel(level);

      const updatedUser: UserData = {
        ...userData,
        premiumtype: level,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );

      setSupporterHistory((previous) => {
        const nextEntry = {
          level,
          created_at: Math.floor(Date.now() / 1000),
        };

        const withoutSameLevel = previous.filter(
          (entry) => entry.level !== level,
        );
        return [...withoutSameLevel, nextEntry];
      });

      toast.success("Supporter tier updated. Changes will be applied shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update supporter level",
      );
    } finally {
      setRevertingSupporterLevel(null);
    }
  };

  const handleRemoveSupporter = async () => {
    if (!userData) {
      return;
    }

    setRevertingSupporterLevel(0);
    try {
      await revertSupporterLevel(0);

      const updatedUser: UserData = {
        ...userData,
        premiumtype: 0,
      };
      safeSetJSON("user", updatedUser);
      window.dispatchEvent(
        new CustomEvent("authStateChanged", { detail: updatedUser }),
      );

      toast.success("Supporter removed. Changes will be applied shortly.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove supporter",
      );
    } finally {
      setRevertingSupporterLevel(null);
    }
  };

  return {
    revertingSupporterLevel,
    handleSupporterLevelUpdate,
    handleRemoveSupporter,
  };
}
