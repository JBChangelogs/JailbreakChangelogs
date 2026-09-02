"use client";

import { useEffect, useState } from "react";
import type { SupporterLevel } from "@/types/auth";
import { fetchSupporterGiftLevels } from "@/services/settingsService";

export function usePurchaseGiftModal() {
  const [open, setOpen] = useState(false);
  const [levels, setLevels] = useState<SupporterLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"self" | "gift">("gift");

  useEffect(() => {
    if (!open) return;
    if (levels.length > 0) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    fetchSupporterGiftLevels()
      .then((availableLevels) => {
        if (!mounted) return;
        const sortedLevels = [...availableLevels].sort(
          (a, b) => a.level - b.level,
        );
        setLevels(sortedLevels);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to fetch supporter levels",
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [levels.length, open]);

  const openModal = () => {
    setTab("gift");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
  const selfLevels = sortedLevels.filter((level) => !level.is_gift);
  const giftLevels = sortedLevels.filter((level) => level.is_gift);

  return {
    open,
    openModal,
    closeModal,
    tab,
    setTab,
    selfLevels,
    giftLevels,
    loading,
    error,
  };
}
