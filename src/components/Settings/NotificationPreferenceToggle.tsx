import { Switch, Field, Label, Description } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserData } from "@/types/auth";

export type NotificationPreferenceToggleProps = {
  title: string;
  enabled: boolean;
  onChange: (nextEnabled: boolean) => void;
  description?: string;
  disabled?: boolean;
  userData?: Pick<UserData, "flags"> | null;
};

function humanizeTitle(title: string) {
  return title
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function NotificationPreferenceToggle({
  title,
  enabled,
  onChange,
  description,
  disabled,
  userData,
}: NotificationPreferenceToggleProps) {
  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", title);
    navigator.clipboard.writeText(url.toString());
    toast.success(`Link for "${humanizeTitle(title)}" copied!`);
  };

  return (
    <div className="mb-4 w-full">
      <Field disabled={disabled} className="w-full">
        <div className="mb-1 flex w-full items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-primary-text text-base font-medium">
              {humanizeTitle(title)}
            </Label>
            {userData?.flags?.some((f) => f.flag === "is_owner") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleCopyLink}
                    className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                    aria-label="Copy highlight link"
                  >
                    <Icon icon="heroicons:link" className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-secondary-bg text-primary-text border-none shadow-[var(--color-card-shadow)]"
                >
                  <p>Copy URL</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <Switch
            checked={enabled}
            onChange={(checked) => onChange(checked)}
            className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
              enabled ? "bg-button-info" : "bg-button-secondary"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </Switch>
        </div>
        <Description className="text-secondary-text text-sm">
          {description ?? "Manage this notification type"}
        </Description>
      </Field>
    </div>
  );
}
