"use client";

import { Switch } from "@/components/ui/switch";
import { useAuthContext } from "@/contexts/AuthContext";
import { useWhatsNewPreference } from "@/hooks/useWhatsNewPreference";

export default function WhatsNewToggle() {
  const { isAuthenticated } = useAuthContext();
  const { disabled, setDisabled } = useWhatsNewPreference();

  if (!isAuthenticated || disabled === null) return null;

  return (
    <label className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-3 text-left">
      <span>
        <span className="text-primary-text block text-sm font-medium">
          Feature announcements
        </span>
        <span className="text-secondary-text block text-xs">
          Show what&apos;s new after each release
        </span>
      </span>
      <Switch
        checked={!disabled}
        onCheckedChange={(checked) => setDisabled(!checked)}
      />
    </label>
  );
}
