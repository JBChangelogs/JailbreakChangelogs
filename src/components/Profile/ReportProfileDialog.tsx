"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/ui/avatar";
import { getProfileBanner } from "@/components/Profile/Banner";
import { convertUrlsToLinks } from "@/utils/ui/urlConverter";
import { sanitizeText } from "@/utils/ui/sanitizeText";
import { PUBLIC_API_URL, getResponseErrorMessage } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { createLogger } from "@/services/logger";
import { usePageSettled } from "@/hooks/usePageSettled";
import type { UserSettingsV2 } from "@/types/auth";

const log = createLogger("UI");
const MAX_REASON_LENGTH = 500;

type ReportTarget =
  | "profile"
  | "avatar"
  | "banner"
  | "background"
  | "description"
  | "username";

interface ReportableUser {
  id: string;
  username: string;
  global_name: string;
  avatar: string;
  custom_avatar?: string;
  banner?: string;
  custom_banner?: string;
  custom_background?: string | null;
  settings_v2?: UserSettingsV2;
  premiumtype?: number;
}

interface ReportProfileDialogProps {
  open: boolean;
  onClose: () => void;
  user: ReportableUser;
  bio: string | null;
  hasVisibleBackground: boolean;
}

export function ReportProfileDialog({
  open,
  onClose,
  user,
  bio,
  hasVisibleBackground,
}: ReportProfileDialogProps) {
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSettled = usePageSettled();
  const { primary: bannerSrc } = getProfileBanner({
    userId: user.id,
    banner: user.banner,
    customBanner: user.custom_banner,
    settings: user.settings_v2,
    premiumType: user.premiumtype,
    size: 512,
  });
  // A stale Discord hash 404s and the profile shows our fallback instead,
  // so only offer the banner once it actually loads.
  const [bannerLoaded, setBannerLoaded] = useState(false);
  useEffect(() => {
    setBannerLoaded(false);
    if (!open || !bannerSrc) return;
    const img = new Image();
    img.onload = () => setBannerLoaded(true);
    img.src = bannerSrc;
    return () => {
      img.onload = null;
    };
  }, [open, bannerSrc]);

  const displayName =
    user.global_name && user.global_name !== "None"
      ? user.global_name
      : user.username;

  const avatar = (size: number) => (
    <UserAvatar
      userId={user.id}
      avatarHash={user.avatar}
      username={user.username}
      custom_avatar={user.custom_avatar}
      size={size}
      showBadge={false}
      settings={user.settings_v2}
      premiumType={user.premiumtype}
    />
  );

  const identityPreview = (size: number) => (
    <div className="border-border-card bg-tertiary-bg/50 flex items-center gap-3 rounded-lg border p-3">
      {avatar(size)}
      <div className="min-w-0">
        <p className="text-primary-text truncate text-sm font-medium">
          {displayName}
        </p>
        <p className="text-secondary-text truncate text-xs">@{user.username}</p>
      </div>
    </div>
  );

  const imagePreview = (src: string | undefined, label: string) => (
    <div className="border-border-card bg-tertiary-bg/50 overflow-hidden rounded-lg border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${user.username}'s ${label}`}
        className="h-auto w-full object-contain"
      />
    </div>
  );

  const options: {
    target: ReportTarget;
    label: string;
    hint: string;
    noun: string;
    icon: string;
    show: boolean;
    preview: () => ReactNode;
  }[] = [
    {
      target: "profile",
      noun: "this user",
      label: "User or behavior",
      hint: "Something they did that isn't covered below",
      icon: "heroicons:user",
      show: true,
      preview: () => identityPreview(9),
    },
    {
      target: "avatar",
      noun: "their avatar",
      label: "Avatar",
      hint: "Their profile picture",
      icon: "heroicons:user-circle",
      show: true,
      preview: () => identityPreview(16),
    },
    {
      target: "banner",
      noun: "their banner",
      label: "Banner",
      hint: "The image at the top of their profile",
      icon: "heroicons:photo",
      show: bannerLoaded,
      preview: () => imagePreview(bannerSrc ?? undefined, "banner"),
    },
    {
      target: "background",
      noun: "their background",
      label: "Background",
      hint: "Their custom profile background",
      icon: "heroicons:photo",
      show: hasVisibleBackground,
      preview: () =>
        imagePreview(user.custom_background ?? undefined, "background"),
    },
    {
      target: "description",
      noun: "their description",
      label: "Description",
      hint: "Their About Me text",
      icon: "heroicons:document-text",
      show: !!bio,
      preview: () => (
        <div className="border-border-card bg-tertiary-bg/50 flex items-start gap-3 rounded-lg border p-3">
          <div className="shrink-0">{avatar(9)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-primary-text truncate text-sm font-medium">
              {displayName}{" "}
              <span className="text-secondary-text text-xs font-normal">
                @{user.username}
              </span>
            </p>
            <p className="text-primary-text/80 mt-0.5 max-h-40 overflow-y-auto text-sm break-words whitespace-pre-wrap">
              {bio && convertUrlsToLinks(sanitizeText(bio))}
            </p>
          </div>
        </div>
      ),
    },
    {
      target: "username",
      noun: "their username",
      label: "Username",
      hint: "Their name or @handle",
      icon: "heroicons:at-symbol",
      show: true,
      preview: () => identityPreview(7),
    },
  ];
  const selected = options.find((option) => option.target === target);

  const close = () => {
    if (isSubmitting) return;
    onClose();
    setTarget(null);
    setReason("");
  };

  const submit = async () => {
    if (!target || !reason.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting report...");
    try {
      const { url, headers } = buildApiFetchRequest(
        PUBLIC_API_URL,
        `/v2/users/${encodeURIComponent(user.id)}/reports`,
      );
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ target, reason: reason.trim() }),
      });
      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to submit report"),
        );
      }
      toast.success("Report submitted", { id: toastId });
      setIsSubmitting(false);
      onClose();
      setTarget(null);
      setReason("");
    } catch (error) {
      log.error(`Error reporting ${target}:`, error);
      toast.error(
        error instanceof Error ? error.message : "Failed to submit report",
        { id: toastId },
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open && pageSettled}
      onOpenChange={(next) => !next && close()}
    >
      <DialogContent
        showClose
        aria-describedby={undefined}
        className="bg-secondary-bg max-w-md rounded-lg p-0 backdrop-blur-none"
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-2">
            {selected && (
              <button
                type="button"
                onClick={() => setTarget(null)}
                disabled={isSubmitting}
                aria-label="Back to report options"
                className="text-secondary-text hover:bg-quaternary-bg hover:text-primary-text -ml-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
              </button>
            )}
            <DialogTitle className="text-primary-text text-left text-xl font-semibold">
              {selected ? `Report ${selected.label.toLowerCase()}` : "Report"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {!selected ? (
          <div className="pb-4">
            <div className="space-y-3 px-6 pt-1 pb-2">
              {identityPreview(9)}
              <p className="text-primary-text text-sm font-medium">
                What do you want to report?
              </p>
            </div>
            <ul className="px-3">
              {options
                .filter((option) => option.show)
                .map((option) => (
                  <li key={option.target}>
                    <button
                      type="button"
                      onClick={() => setTarget(option.target)}
                      className="hover:bg-tertiary-bg focus-visible:ring-border-focus flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <Icon
                        icon={option.icon}
                        className="text-secondary-text h-5 w-5 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-primary-text block text-sm font-medium">
                          {option.label}
                        </span>
                        <span className="text-secondary-text block text-xs">
                          {option.hint}
                        </span>
                      </span>
                      <Icon
                        icon="heroicons:chevron-right"
                        className="text-secondary-text h-4 w-4 shrink-0"
                      />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-3 px-6 pt-1 pb-6">
            {selected.preview()}
            <div>
              <label
                htmlFor="report-profile-reason"
                className="text-primary-text mb-1.5 block text-sm font-medium"
              >
                Why are you reporting {selected.noun}?
              </label>
              <textarea
                id="report-profile-reason"
                className="border-border-card bg-tertiary-bg text-primary-text placeholder:text-secondary-text focus:ring-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
                rows={4}
                maxLength={MAX_REASON_LENGTH}
                autoFocus
                placeholder="Describe the problem and include any useful context..."
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
              <p
                className={`mt-1 text-right text-xs ${reason.length >= MAX_REASON_LENGTH ? "text-red-500" : "text-secondary-text"}`}
              >
                {reason.length}/{MAX_REASON_LENGTH}
              </p>
            </div>
            <DialogFooter className="mt-4 gap-2 px-0 pt-2 pb-0">
              <Button
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={close}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!reason.trim() || isSubmitting}
                onClick={() => void submit()}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
