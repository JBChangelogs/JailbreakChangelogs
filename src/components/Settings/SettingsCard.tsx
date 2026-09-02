import type { ComponentProps, CSSProperties, ReactNode, Ref } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SettingsCardProps {
  id: string;
  title: string;
  icon: ComponentProps<typeof Icon>["icon"];
  isOwner: boolean;
  highlightStyle?: CSSProperties;
  scrollRef?: Ref<HTMLDivElement>;
  onCopyLink: () => void;
  children: ReactNode;
  headerAccessory?: ReactNode;
  className?: string;
  dividerClassName?: string;
  copyAriaLabel?: string;
}

export default function SettingsCard({
  id,
  title,
  icon,
  isOwner,
  highlightStyle,
  scrollRef,
  onCopyLink,
  children,
  headerAccessory,
  className,
  dividerClassName = "border-border-card mb-2 border-t",
  copyAriaLabel = "Copy section link",
}: SettingsCardProps) {
  return (
    <div
      id={id}
      className={`border-border-card bg-secondary-bg text-primary-text mb-8 rounded-xl border p-6 shadow-md${className ? ` ${className}` : ""}`}
      style={highlightStyle}
      ref={scrollRef}
    >
      <h2 className="text-primary-text mb-2 flex items-center gap-1.5 text-xl font-bold">
        <Icon icon={icon} className="h-6 w-6" />
        {title}
        {isOwner && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCopyLink}
                className="text-secondary-text hover:text-link cursor-pointer transition-colors"
                aria-label={copyAriaLabel}
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
      </h2>
      {headerAccessory}
      <div className={dividerClassName} />
      {children}
    </div>
  );
}
