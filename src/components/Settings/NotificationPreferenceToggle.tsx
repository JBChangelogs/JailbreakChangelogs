import { Switch, Field, Label, Description } from "@headlessui/react";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import Tooltip from "@mui/material/Tooltip";
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
    <div className="mb-2">
      <Field disabled={disabled}>
        <div className="flex items-center gap-2">
          <Label className="text-primary-text text-base font-medium">
            {humanizeTitle(title)}
          </Label>
          {userData?.flags?.some((f) => f.flag === "is_owner") && (
            <Tooltip
              title="Copy URL"
              arrow
              placement="top"
              slotProps={{
                tooltip: {
                  sx: {
                    backgroundColor: "var(--color-secondary-bg)",
                    color: "var(--color-primary-text)",
                    "& .MuiTooltip-arrow": {
                      color: "var(--color-secondary-bg)",
                    },
                  },
                },
              }}
            >
              <button
                onClick={handleCopyLink}
                className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                aria-label="Copy highlight link"
              >
                <Icon icon="heroicons:link" className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
        </div>
        <Description className="text-secondary-text text-sm">
          {description ?? "Manage this notification type"}
        </Description>
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
      </Field>
    </div>
  );
}
