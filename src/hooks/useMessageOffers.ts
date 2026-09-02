"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Message,
  MessageUser,
  OfferAcceptedMetadata,
} from "@/utils/messages/types";
import {
  asId,
  normalizeOfferItems,
  parseOfferAcceptedMetadata,
} from "@/utils/messages/parsing";
import { PUBLIC_API_URL } from "@/utils/api/api";
import {
  useOfferDetailsBatch,
  type TradeOfferDetails,
} from "@/hooks/useOfferDetailsBatch";

interface UseMessageOffersOptions {
  messages: Message[];
  selectedUser: MessageUser | null;
  selectedUserId: string | null;
  currentUserId: string | null;
}

export function useMessageOffers({
  messages,
  selectedUser,
  selectedUserId,
  currentUserId,
}: UseMessageOffersOptions) {
  const [isMarkingOfferComplete, setIsMarkingOfferComplete] = useState(false);

  const getOfferDetailsKey = useCallback(
    (metadata: OfferAcceptedMetadata) =>
      `${metadata.trade}:${metadata.offer}` as const,
    [],
  );

  const offerAcceptedEvents = useMemo(() => {
    const parsed = messages
      .map((message) => {
        const metadata = parseOfferAcceptedMetadata(
          message.metadata ?? undefined,
        );
        if (!metadata) return null;
        return {
          messageId: message.id,
          createdAt: message.createdAt ?? 0,
          metadata,
        };
      })
      .filter(Boolean) as Array<{
      messageId: string;
      createdAt: number;
      metadata: OfferAcceptedMetadata;
    }>;

    parsed.sort((a, b) => b.createdAt - a.createdAt);
    return parsed;
  }, [messages]);

  const [activeOfferAcceptedIndex, setActiveOfferAcceptedIndex] = useState(0);
  const [isOfferBannerMinimized, setIsOfferBannerMinimized] = useState(true);

  const {
    map: offerDetailsMap,
    setMap: setOfferDetailsMap,
    status: offerDetailsStatus,
  } = useOfferDetailsBatch(offerAcceptedEvents.map((entry) => entry.metadata));

  const visibleOfferAcceptedEvents = useMemo(() => {
    return offerAcceptedEvents.filter((entry) => {
      const key = getOfferDetailsKey(entry.metadata);
      const cached = offerDetailsMap[key];
      if (cached === null) return false;
      if (cached && cached.status !== 1) return false;
      return true;
    });
  }, [offerAcceptedEvents, getOfferDetailsKey, offerDetailsMap]);

  useEffect(() => {
    setActiveOfferAcceptedIndex(0);
    setIsOfferBannerMinimized(true);
  }, [selectedUserId, visibleOfferAcceptedEvents.length]);

  useEffect(() => {
    if (
      activeOfferAcceptedIndex >= visibleOfferAcceptedEvents.length &&
      visibleOfferAcceptedEvents.length > 0
    ) {
      setActiveOfferAcceptedIndex(visibleOfferAcceptedEvents.length - 1);
    }
    if (visibleOfferAcceptedEvents.length === 0) {
      setActiveOfferAcceptedIndex(0);
    }
  }, [activeOfferAcceptedIndex, visibleOfferAcceptedEvents.length]);

  useEffect(() => {
    // Default to minimized on small screens to preserve chat space.
    const query = window.matchMedia("(min-width: 640px)");
    const apply = () => setIsOfferBannerMinimized(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const activeOfferAccepted =
    visibleOfferAcceptedEvents[activeOfferAcceptedIndex];

  const activeOfferDetailsStatus = useMemo<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "loaded"; data: TradeOfferDetails }
    | { status: "not_found" }
    | { status: "error"; error: string }
  >(() => {
    if (!activeOfferAccepted) return { status: "idle" };
    if (!PUBLIC_API_URL) {
      return { status: "error", error: "Trade API is not configured" };
    }
    if (offerDetailsStatus === "error") {
      return { status: "error", error: "Unable to load trade offer details" };
    }
    const key = getOfferDetailsKey(activeOfferAccepted.metadata);
    const cached = offerDetailsMap[key];
    if (cached) return { status: "loaded", data: cached };
    if (cached === null) return { status: "not_found" };
    if (offerDetailsStatus === "loading") return { status: "loading" };
    return { status: "loading" };
  }, [
    activeOfferAccepted,
    getOfferDetailsKey,
    offerDetailsMap,
    offerDetailsStatus,
  ]);

  useEffect(() => {
    if (activeOfferAcceptedIndex < visibleOfferAcceptedEvents.length) return;
    setActiveOfferAcceptedIndex(
      Math.max(0, visibleOfferAcceptedEvents.length - 1),
    );
  }, [activeOfferAcceptedIndex, visibleOfferAcceptedEvents.length]);

  const showOfferAcceptedBanner =
    !!selectedUser &&
    visibleOfferAcceptedEvents.length > 0 &&
    offerDetailsStatus === "loaded";

  const activeOfferItems = useMemo(() => {
    if (activeOfferDetailsStatus.status !== "loaded") return null;
    return {
      offering: normalizeOfferItems(activeOfferDetailsStatus.data.offering),
      requesting: normalizeOfferItems(activeOfferDetailsStatus.data.requesting),
    };
  }, [activeOfferDetailsStatus]);
  const canMarkOfferComplete = useMemo(() => {
    if (!currentUserId || !activeOfferAccepted) return false;
    const tradeOwnerId = activeOfferAccepted.metadata.trade_user;
    if (typeof tradeOwnerId !== "string" && typeof tradeOwnerId !== "number") {
      return false;
    }
    return asId(tradeOwnerId) === asId(currentUserId);
  }, [activeOfferAccepted, currentUserId]);

  return {
    offerAcceptedEvents,
    visibleOfferAcceptedEvents,
    activeOfferAcceptedIndex,
    setActiveOfferAcceptedIndex,
    isOfferBannerMinimized,
    setIsOfferBannerMinimized,
    activeOfferDetailsStatus,
    activeOfferItems,
    canMarkOfferComplete,
    showOfferAcceptedBanner,
    isMarkingOfferComplete,
    setIsMarkingOfferComplete,
    getOfferDetailsKey,
    setOfferDetailsMap,
  };
}
