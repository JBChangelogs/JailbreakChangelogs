import { Switch, Field, Label, Description } from "@headlessui/react";
import { SettingConfigItem } from "@/config/settings";
import { UserSettings } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import Tooltip from "@mui/material/Tooltip";

interface SettingToggleProps {
  name: keyof UserSettings;
  value: number;
  config: SettingConfigItem;
  onChange: (name: keyof UserSettings, value: number) => void;
  disabled?: boolean;
  userData?: {
    premiumtype?: number;
  };
}

export const SettingToggle = ({
  name,
  value,
  config,
  onChange,
  disabled,
}: SettingToggleProps) => {
  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", name);
    navigator.clipboard.writeText(url.toString());
    toast.success(`Link for "${config.displayName}" copied!`);
  };

  return (
    <div className="mb-2">
      <Field disabled={disabled}>
        <div className="flex items-center gap-2">
          <Label className="text-primary-text text-base font-medium">
            {config.displayName}
          </Label>
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
        </div>
        <Description className="text-secondary-text text-sm">
          {config.description}
        </Description>
        <Switch
          checked={value === 1}
          onChange={(checked) => onChange(name, checked ? 1 : 0)}
          className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
            value === 1 ? "bg-button-info" : "bg-button-secondary"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value === 1 ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </Switch>
      </Field>
    </div>
  );
};
