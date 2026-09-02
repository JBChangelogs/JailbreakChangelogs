"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { SupporterGift, UserData } from "@/types/auth";
import { giftSupporterGift } from "@/services/settingsService";
import { useUserSearch } from "@/hooks/useUserSearch";

interface UseSupporterGiftingOptions {
  userId: string | null;
  setSupporterGifts: Dispatch<SetStateAction<SupporterGift[]>>;
}

export function useSupporterGifting({
  userId,
  setSupporterGifts,
}: UseSupporterGiftingOptions) {
  const [giftingIds, setGiftingIds] = useState<Record<string, boolean>>({});
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftModalStep, setGiftModalStep] = useState<"search" | "confirm">(
    "search",
  );
  const [activeGift, setActiveGift] = useState<SupporterGift | null>(null);
  const [giftSearchQuery, setGiftSearchQuery] = useState("");
  const [selectedGiftRecipient, setSelectedGiftRecipient] =
    useState<UserData | null>(null);
  const { results: giftSearchResults, isLoading: giftSearchLoading } =
    useUserSearch(giftSearchQuery, userId, {
      limit: 5,
      enabled: giftModalOpen && !!activeGift,
    });

  const closeGiftModal = () => {
    setGiftModalOpen(false);
    setGiftModalStep("search");
    setActiveGift(null);
    setGiftSearchQuery("");
    setSelectedGiftRecipient(null);
  };

  const handleGiftModalDismiss = () => {
    if (giftModalStep === "confirm") {
      setGiftModalStep("search");
      return;
    }
    closeGiftModal();
  };

  const openGiftModalForGift = (gift: SupporterGift) => {
    setActiveGift(gift);
    setGiftModalOpen(true);
    setGiftModalStep("search");
    setGiftSearchQuery("");
    setSelectedGiftRecipient(null);
  };

  const handleGiftSearchQueryChange = (query: string) => {
    setGiftSearchQuery(query);
    setSelectedGiftRecipient(null);
  };

  const handleGiftRecipientSelect = (recipient: UserData) => {
    setSelectedGiftRecipient(recipient);
    setGiftModalStep("confirm");
  };

  const handleGiftSubmit = async () => {
    if (!activeGift || !selectedGiftRecipient?.id) {
      toast.error("Select a user from search results first.");
      return;
    }

    setGiftingIds((previous) => ({
      ...previous,
      [activeGift.share_id]: true,
    }));
    try {
      await giftSupporterGift(activeGift.share_id, selectedGiftRecipient.id);
      setSupporterGifts((previous) =>
        previous.filter((gift) => gift.share_id !== activeGift.share_id),
      );
      toast.success("Gift sent successfully.");
      closeGiftModal();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to gift purchase",
      );
    } finally {
      setGiftingIds((previous) => ({
        ...previous,
        [activeGift.share_id]: false,
      }));
    }
  };

  const handleRedeemForSelf = async (shareId: string) => {
    if (!userId) {
      toast.info("You must be logged in to redeem this gift.");
      return;
    }

    setGiftingIds((previous) => ({ ...previous, [shareId]: true }));
    try {
      await giftSupporterGift(shareId, userId);
      setSupporterGifts((previous) =>
        previous.filter((gift) => gift.share_id !== shareId),
      );
      if (activeGift?.share_id === shareId) {
        closeGiftModal();
      }
      toast.success("Gift redeemed successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to redeem gift",
      );
    } finally {
      setGiftingIds((previous) => ({ ...previous, [shareId]: false }));
    }
  };

  return {
    giftingIds,
    giftModalOpen,
    giftModalStep,
    activeGift,
    giftSearchQuery,
    giftSearchResults,
    giftSearchLoading,
    selectedGiftRecipient,
    handleGiftModalDismiss,
    openGiftModalForGift,
    handleGiftSearchQueryChange,
    handleGiftRecipientSelect,
    handleGiftSubmit,
    handleRedeemForSelf,
  };
}
