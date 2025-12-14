"use client";

import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSupporterModal } from "@/hooks/useSupporterModal";
import SupporterModal from "@/components/Modals/SupporterModal";

function isLikelyNitroVideoPlayerCloseClick(
  target: EventTarget | null,
): boolean {
  if (!target) return false;

  const el =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  if (!el) return false;
  return !!el.closest(".nitro-floating-closer.nitro-floating-visible");
}

export default function NitroVideoPlayerCloseSupporterModal() {
  const { user } = useAuthContext();
  const isSupporter = !!(user?.premiumtype && user.premiumtype > 0);
  const { modalState, openModal, closeModal } = useSupporterModal();

  useEffect(() => {
    if (isSupporter) return;

    const handler = (e: Event) => {
      if (!isLikelyNitroVideoPlayerCloseClick(e.target)) return;

      (
        e as Event & { stopImmediatePropagation?: () => void }
      ).stopImmediatePropagation?.();
      e.preventDefault?.();
      e.stopPropagation?.();

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
