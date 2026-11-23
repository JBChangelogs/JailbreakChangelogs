"use client";

import { Icon } from "@/components/ui/IconWrapper";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface LoginModalViewProps {
  showLoginModal: boolean;
  canLinkRoblox: boolean;
  joinDiscord: boolean;
  onClose: () => void;
  onJoinDiscordChange: (checked: boolean) => void;
  onDiscordLogin: () => void;
  onRobloxLogin: () => void;
}

export default function LoginModalView({
  showLoginModal,
  canLinkRoblox,
  joinDiscord,
  onClose,
  onJoinDiscordChange,
  onDiscordLogin,
  onRobloxLogin,
}: LoginModalViewProps) {
  return (
    <Dialog open={showLoginModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showClose>
        <DialogTitle className="text-primary-text mb-2 pr-6 text-lg font-semibold">
          {canLinkRoblox
            ? "Link your Roblox account"
            : "Sign in to Jailbreak Changelogs"}
        </DialogTitle>
        <DialogDescription className="text-secondary-text mb-5 text-sm leading-6">
          {canLinkRoblox
            ? "Connect your Jailbreak inventory, access trading features, and participate in item suggestions."
            : "Sign in with Discord to create your profile. Link Roblox after signing in to access trading features."}
        </DialogDescription>
        <div className="text-secondary-text mb-5 flex items-center justify-center gap-1.5 text-xs">
          <Icon
            icon="heroicons:shield-check"
            className="text-link size-4 shrink-0"
            aria-hidden="true"
          />
          <span>We never see or store your password.</span>
        </div>
        <div className="space-y-4 text-center">
          {!canLinkRoblox && (
            <label
              htmlFor="join-discord"
              className="border-border-card bg-tertiary-bg hover:bg-quaternary-bg flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors select-none"
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
          )}
          <Button
            onClick={canLinkRoblox ? onRobloxLogin : onDiscordLogin}
            variant="default"
            size="lg"
            className="w-full"
            data-rybbit-event={
              canLinkRoblox ? "Login with Roblox" : "Login with Discord"
            }
          >
            <Icon
              icon={
                canLinkRoblox ? "simple-icons:roblox" : "ic:baseline-discord"
              }
              aria-hidden="true"
            />
            {canLinkRoblox ? "Continue with Roblox" : "Continue with Discord"}
          </Button>
          <p className="text-secondary-text text-xs">
            By continuing, you agree to our{" "}
            <a
              href="/tos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover whitespace-nowrap underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link hover:text-link-hover whitespace-nowrap underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
