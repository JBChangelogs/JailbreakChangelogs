"use client";

import type { SyntheticEvent } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface LoginModalViewProps {
  showLoginModal: boolean;
  tabValue: number;
  hasJbclToken: boolean;
  onlyRoblox: boolean;
  resolvedTheme: string | undefined;
  joinDiscord: boolean;
  onTabChange: (_event: SyntheticEvent, newValue: number) => void;
  onClose: () => void;
  onJoinDiscordChange: (checked: boolean) => void;
  onDiscordLogin: () => void;
  onRobloxLogin: () => void;
}

export default function LoginModalView({
  showLoginModal,
  tabValue,
  hasJbclToken,
  onlyRoblox,
  resolvedTheme,
  joinDiscord,
  onTabChange,
  onClose,
  onJoinDiscordChange,
  onDiscordLogin,
  onRobloxLogin,
}: LoginModalViewProps) {
  const activeTab = tabValue === 1 && hasJbclToken ? "roblox" : "discord";

  const handleTabChange = (value: string) => {
    onTabChange({} as SyntheticEvent, value === "roblox" ? 1 : 0);
  };

  const isDark = resolvedTheme === "dark";

  const trustBadge = (
    <div className="text-secondary-text mb-4 flex items-center justify-center gap-1.5 text-xs">
      <Icon
        icon="heroicons:shield-check"
        className="text-link size-4 shrink-0"
      />
      <span>We never see or store your password.</span>
    </div>
  );

  return (
    <Dialog open={showLoginModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-[480px]:top-0 max-[480px]:h-screen max-[480px]:max-w-full max-[480px]:translate-y-0 max-[480px]:rounded-none"
        showClose
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">
          Sign in to Jailbreak Changelogs
        </DialogTitle>
        <DialogDescription className="sr-only">
          Choose a login method to continue.
        </DialogDescription>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList
            fullWidth
            className="border-border-primary mb-6 rounded-none border-b bg-transparent pb-0"
          >
            {!onlyRoblox && (
              <TabsTrigger value="discord" fullWidth className="pb-3">
                <Image
                  src={
                    isDark
                      ? "/logos/discord/Discord_Logo.webp"
                      : "/logos/discord/Discord_Logo_Dark.webp"
                  }
                  alt="Discord"
                  width={132}
                  height={36}
                  draggable={false}
                  className="h-auto w-[88px] max-[480px]:w-[72px] sm:w-[132px]"
                />
              </TabsTrigger>
            )}
            {hasJbclToken && (
              <TabsTrigger value="roblox" fullWidth className="pb-3">
                <Image
                  src={
                    isDark
                      ? "/logos/roblox/Roblox_Logo.webp"
                      : "/logos/roblox/Roblox_Logo_Dark.webp"
                  }
                  alt="Roblox"
                  width={112}
                  height={36}
                  draggable={false}
                  className="h-auto w-[76px] max-[480px]:w-[64px] sm:w-[112px]"
                />
              </TabsTrigger>
            )}
          </TabsList>

          {!onlyRoblox && (
            <TabsContent value="discord">
              <p className="text-secondary-text mb-4 text-center text-sm">
                Jailbreak Changelogs connects with Discord to build your user
                profile. We only collect your publicly available Discord
                details. To use our trading features, you&apos;ll need to link
                your Roblox account after signing in.
              </p>
              {trustBadge}
              <div className="space-y-4 text-center">
                <p className="text-primary-text mb-4 text-xs">
                  By continuing, you agree to our{" "}
                  <a
                    href="/tos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
                <label
                  htmlFor="join-discord"
                  className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg mb-4 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors select-none"
                >
                  <Checkbox
                    id="join-discord"
                    className="border-primary-text shrink-0"
                    checked={joinDiscord}
                    onCheckedChange={(checked) =>
                      onJoinDiscordChange(checked === true)
                    }
                  />
                  <span className="text-primary-text text-sm">
                    Join our Discord server
                  </span>
                </label>
                <Button
                  onClick={onDiscordLogin}
                  variant="default"
                  size="lg"
                  className="w-full"
                  data-rybbit-event="Login with Discord"
                >
                  Continue with Discord
                </Button>
              </div>
            </TabsContent>
          )}

          {hasJbclToken && (
            <TabsContent value="roblox">
              <p className="text-secondary-text mb-4 text-center text-sm">
                Jailbreak Changelogs connects with Roblox to build your user
                profile. We only collect your publicly available Roblox details.
                To use our trading features, you&apos;ll need to link your
                Roblox account after signing in.
              </p>
              {trustBadge}
              <div className="space-y-4 text-center">
                <p className="text-primary-text mb-4 text-xs">
                  By continuing, you agree to our{" "}
                  <a
                    href="/tos"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link hover:text-link-hover underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
                <Button
                  onClick={onRobloxLogin}
                  variant="default"
                  size="lg"
                  className="w-full"
                  data-rybbit-event="Login with Roblox"
                >
                  Continue with Roblox
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
