import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsSubsectionHeadingProps {
  title: string;
  onCopyLink?: () => void;
}

export function SettingsSubsectionHeading({
  title,
  onCopyLink,
}: SettingsSubsectionHeadingProps) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <h3 className="text-primary-text text-lg font-bold">{title}</h3>
      {onCopyLink && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onCopyLink}
              className="text-secondary-text hover:text-link cursor-pointer transition-colors"
              aria-label={`Copy link to ${title}`}
            >
              <Icon icon="heroicons:link" className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Copy URL</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
