import { Icon } from "@/components/ui/IconWrapper";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
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
      <div className="mb-1 flex w-full items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-primary-text text-base font-medium">
            {humanizeTitle(title)}
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
          checked={enabled}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
      <p className="text-secondary-text text-sm">
        {description ?? "Manage this notification type"}
      </p>
    </div>
  );
}
