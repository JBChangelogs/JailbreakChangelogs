"use client";

import { Suspense } from "react";
import LoginModalView from "./LoginModalView";
import { useLoginModalController } from "./useLoginModalController";

function LoginModalInner() {
  const controller = useLoginModalController();

  return (
    <LoginModalView
      showLoginModal={controller.showLoginModal}
      tabValue={controller.tabValue}
      campaign={controller.campaign}
      resolvedTheme={controller.resolvedTheme}
      joinDiscord={controller.joinDiscord}
      onTabChange={controller.handleTabChange}
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
