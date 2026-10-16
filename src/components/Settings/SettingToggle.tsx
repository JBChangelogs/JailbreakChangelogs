import { SETTING_HIGHLIGHT } from "./SettingsCard";
import { UserData } from "@/types/auth";
import { CopyLinkButton } from "./CopyLinkButton";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface SettingToggleProps {
  name: string;
  value: boolean;
  description: string;
  displayName: string;
  onChange: (name: string, value: boolean) => void;
  disabled?: boolean;
  userData?: Pick<UserData, "flags"> | null;
}

export const SettingToggle = ({
  name,
  value,
  description,
  displayName,
  onChange,
  disabled,
  userData,
}: SettingToggleProps) => {
  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("highlight", name);
    navigator.clipboard.writeText(url.toString());
    toast.success(`Link for "${displayName}" copied!`);
  };

  return (
    <div className={`group/setting w-full ${SETTING_HIGHLIGHT}`}>
      <div
        className={`mb-1 flex w-full items-center justify-between gap-4 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <label className="text-primary-text text-base font-medium">
            {displayName}
          </label>
          {userData?.flags?.some((f) => f.flag === "is_owner") && (
            <CopyLinkButton
              label="Copy highlight link"
              onClick={handleCopyLink}
              scope="setting"
            />
          )}
        </div>
        <Switch
          checked={value}
          onCheckedChange={(checked) => onChange(name, checked)}
          disabled={disabled}
        />
      </div>
      <p className="text-secondary-text text-sm">{description}</p>
    </div>
  );
};
