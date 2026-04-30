import { UserData } from "@/types/auth";
import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="mb-4 w-full">
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
                className="bg-secondary-bg text-primary-text border-none shadow-(--color-card-shadow)"
              >
                <p>Copy URL</p>
              </TooltipContent>
            </Tooltip>
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
