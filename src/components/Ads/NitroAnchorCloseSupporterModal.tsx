"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";

function isLikelyNitroAnchorCloseClick(target: EventTarget | null): boolean {
  if (!target) return false;

  // Clicks may originate from nested SVG/path elements or even text nodes.
  // Normalize to an Element that supports closest().
  const el =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  if (!el) return false;
  return !!el.closest("#np-bottom-anchor-close");
}

export default function NitroAnchorCloseSupporterModal() {
  const { user } = useAuthContext();
  const isSupporter = !!(user?.premiumtype && user.premiumtype > 0);
  const { modalState, openModal, closeModal } = useSupporterModal();

  useEffect(() => {
    if (isSupporter) return;

    const handler = (e: Event) => {
      if (!isLikelyNitroAnchorCloseClick(e.target)) return;

      // Block Nitro's close action for non-supporters.
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      openModal({
        feature: "hide_ads",
        requiredTier: 1,
        currentTier: 0,
        currentLimit: "Free",
        requiredLimit: "Supporter I",
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
