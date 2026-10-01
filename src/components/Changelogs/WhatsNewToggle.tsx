"use client";

import { Icon } from "@/components/ui/IconWrapper";
import { Switch } from "@/components/ui/switch";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWhatsNewPreference } from "@/hooks/useWhatsNewPreference";

export default function WhatsNewToggle() {
  const { isAuthenticated } = useAuthContext();
  const { disabled, setDisabled } = useWhatsNewPreference();

  if (!isAuthenticated || disabled === null) return null;

  return (
    <div className="mb-6 md:pr-4 md:pl-16">
      <label className="border-border-card bg-secondary-bg flex cursor-pointer items-center gap-4 rounded-lg border px-5 py-4">
        <span className="bg-tertiary-bg text-secondary-text flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon icon="heroicons-outline:megaphone" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-primary-text block text-sm font-semibold">
            Feature announcements
          </span>
          <span className="text-secondary-text block text-sm">
            Show what&apos;s new after each release
          </span>
        </span>
        <Switch
          checked={!disabled}
          onCheckedChange={(checked) => setDisabled(!checked)}
        />
      </label>
    </div>
  );
}
