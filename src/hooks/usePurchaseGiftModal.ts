"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSupporterGiftLevels } from "@/services/settingsService";

export function usePurchaseGiftModal() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"self" | "gift">("gift");
  const levelsQuery = useQuery({
    queryKey: ["supporter-gift-levels"],
    queryFn: fetchSupporterGiftLevels,
    enabled: open,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  });

  const openModal = () => {
    setTab("gift");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
  };

  const sortedLevels = [...(levelsQuery.data ?? [])].sort(
    (a, b) => a.level - b.level,
  );
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
    loading: open && levelsQuery.isPending,
    error: levelsQuery.data ? null : (levelsQuery.error?.message ?? null),
  };
}
