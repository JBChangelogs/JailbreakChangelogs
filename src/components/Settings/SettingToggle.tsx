import { SettingConfigItem } from "@/config/settings";
import { UserSettings, UserData } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingToggleProps {
  name: keyof UserSettings;
  value: number | boolean | string;
  config: SettingConfigItem;
  onChange: (name: keyof UserSettings, value: number) => void;
  disabled?: boolean;
  userData?: Pick<UserData, "flags"> | null;
}

export const SettingToggle = ({
  name,
  value,
  config,
  onChange,
  disabled,
  userData,
}: SettingToggleProps) => {
  const isChecked = value === 1 || value === "1" || value === true;

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", name);
    navigator.clipboard.writeText(url.toString());
    toast.success(`Link for "${config.displayName}" copied!`);
  };

  return (
    <div className="mb-4 w-full">
      <div
        className={`mb-1 flex w-full items-center justify-between gap-4 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <label className="text-primary-text text-base font-medium">
            {config.displayName}
          </label>
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
          checked={isChecked}
          onCheckedChange={(checked) => onChange(name, checked ? 1 : 0)}
          disabled={disabled}
        />
      </div>
      <p className="text-secondary-text text-sm">{config.description}</p>
    </div>
  );
};
