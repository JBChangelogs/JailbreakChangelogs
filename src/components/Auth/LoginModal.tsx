"use client";

import { Suspense } from "react";
import LoginModalView from "./LoginModalView";
import { useLoginModalController } from "./useLoginModalController";
import HumanVerificationModal from "@/components/HumanVerification/HumanVerificationModal";

function LoginModalInner() {
  const controller = useLoginModalController();

  if (controller.verification) {
    return (
      <HumanVerificationModal
        isOpen
        captchaType={controller.verification.captchaType}
        reasonMessage={controller.verification.message}
        isLoadingReason={false}
        onVerified={controller.handleVerified}
      />
    );
  }

  return (
    <LoginModalView
      showLoginModal={controller.showLoginModal}
      canLinkRoblox={controller.canLinkRoblox}
      joinDiscord={controller.joinDiscord}
      onClose={controller.handleClose}
      onJoinDiscordChange={controller.setJoinDiscord}
      onDiscordLogin={controller.handleDiscordLogin}
      onRobloxLogin={controller.handleRobloxLogin}
    />
  );
}

export default function LoginModal() {
  return (
    <Suspense fallback={null}>
      <LoginModalInner />
    </Suspense>
  );
}
