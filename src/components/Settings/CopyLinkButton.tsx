import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Literal classes, so Tailwind sees them. A section (card) and a setting
// (row) are separate groups, so hovering a card doesn't reveal every row's.
const REVEAL = {
  section: "group-hover/section:opacity-100",
  setting: "group-hover/setting:opacity-100",
};

/**
 * The owner-only "Copy URL" button beside a section or setting title. It shows
 * on hover of its `group/section` or `group/setting` parent, on keyboard
 * focus, and always on touch screens, which can't hover.
 */
export function CopyLinkButton({
  label,
  onClick,
  scope,
}: {
  label: string;
  onClick: () => void;
  scope: keyof typeof REVEAL;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className={cn(
            "text-secondary-text hover:text-link cursor-pointer opacity-0 transition-[color,opacity] focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
            REVEAL[scope],
          )}
        >
          <Icon icon="heroicons:link" className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Copy URL</p>
      </TooltipContent>
    </Tooltip>
  );
}
