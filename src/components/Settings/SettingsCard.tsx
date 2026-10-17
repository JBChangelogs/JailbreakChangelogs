import type { ComponentProps, CSSProperties, ReactNode, Ref } from "react";
import { Icon } from "@/components/ui/IconWrapper";
import { CopyLinkButton } from "./CopyLinkButton";

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
  copyAriaLabel?: string;
  variant?: "default" | "danger";
}

/**
 * Spacing for the settings inside a card: a plain gap between each. The only
 * line in a card is the one under its header.
 */
export const SETTINGS_LIST = "space-y-6";

/**
 * For a setting with an on/off switch: a soft highlight while hovered or
 * focused, so it's clear which one is about to change. Drawn behind the row
 * and spilling past its edges, so it doesn't change the spacing.
 */
export const SETTING_HIGHLIGHT =
  "relative isolate before:absolute before:-inset-x-3 before:-inset-y-2 before:-z-10 before:rounded-lg before:transition-colors before:duration-200 motion-reduce:before:transition-none hover:before:bg-tertiary-bg/60 has-focus-visible:before:bg-tertiary-bg/60";

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
  copyAriaLabel = "Copy section link",
  variant = "default",
}: SettingsCardProps) {
  const isDanger = variant === "danger";

  return (
    <div
      id={id}
      // Danger: a flat red bar across the top, in place of the top border
      // and clipped to the card's corners.
      className={`group/section border-border-card bg-secondary-bg text-primary-text mb-8 scroll-mt-24 rounded-xl border p-6 shadow-md transition-colors duration-500${isDanger ? " relative overflow-hidden border-t-0" : ""}${className ? ` ${className}` : ""}`}
      style={highlightStyle}
      ref={scrollRef}
    >
      {isDanger && (
        <div
          aria-hidden="true"
          className="bg-button-danger absolute inset-x-0 top-0 h-1"
        />
      )}
      <h2
        className={`${isDanger ? "text-button-danger" : "text-primary-text"} flex items-center gap-1.5 text-xl font-bold`}
      >
        <Icon
          icon={icon}
          className="h-6 w-6"
          style={isDanger ? { color: "var(--color-button-danger)" } : undefined}
        />
        {title}
        {isOwner && (
          <CopyLinkButton
            label={copyAriaLabel}
            onClick={onCopyLink}
            scope="section"
          />
        )}
      </h2>
      {headerAccessory && (
        <div className="text-secondary-text mt-1 space-y-1 text-sm">
          {headerAccessory}
        </div>
      )}
      <div
        className="border-border-card my-3 border-t"
        style={
          isDanger
            ? {
                borderColor: "var(--color-button-danger)",
                opacity: 0.3,
              }
            : undefined
        }
      />
      {children}
    </div>
  );
}
