"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  HIDE_ADS_REQUIRED_TIER,
  SUPPORTER_TIER_NAMES,
} from "@/config/supporter";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";

function isLikelyNitroVideoCloseClick(target: EventTarget | null): boolean {
  if (!target) return false;

  const el =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  if (!el) return false;
  return !!el.closest(".nitro-floating-closer");
}

export default function NitroVideoCloseSupporterModal() {
  const { user } = useAuthContext();
  const tier = user?.premiumtype ?? 0;
  const isSupporter = tier >= HIDE_ADS_REQUIRED_TIER && tier <= 3;
  const { modalState, openModal, closeModal } = useSupporterModal();

  useEffect(() => {
    if (isSupporter) return;

    const handler = (e: Event) => {
      if (!isLikelyNitroVideoCloseClick(e.target)) return;

      // Block Nitro floating close action for non-supporters.
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      openModal({
        feature: "hide_ads",
        requiredTier: HIDE_ADS_REQUIRED_TIER,
        currentTier: 0,
        currentLimit: SUPPORTER_TIER_NAMES[0],
        requiredLimit: SUPPORTER_TIER_NAMES[HIDE_ADS_REQUIRED_TIER],
      });
    };

    const opts: AddEventListenerOptions = { capture: true, passive: false };
    document.addEventListener("pointerdown", handler, opts);
    document.addEventListener("mousedown", handler, opts);
    document.addEventListener("touchstart", handler, opts);
    document.addEventListener("click", handler, opts);
    return () => {
      document.removeEventListener("pointerdown", handler, opts);
      document.removeEventListener("mousedown", handler, opts);
      document.removeEventListener("touchstart", handler, opts);
      document.removeEventListener("click", handler, opts);
    };
  }, [isSupporter, openModal]);

  return (
    <SupporterModal
      isOpen={modalState.isOpen}
      onClose={closeModal}
      feature={modalState.feature}
      currentTier={modalState.currentTier}
      requiredTier={modalState.requiredTier}
      currentLimit={modalState.currentLimit}
      requiredLimit={modalState.requiredLimit}
    />
  );
}
