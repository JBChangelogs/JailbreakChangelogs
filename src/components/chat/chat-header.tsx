import * as React from "react";
import { cn } from "@/lib/utils";

export interface ChatHeaderProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Sticky header container for the chat. Renders as a flex row pinned
 * to the top of the `Chat` container.
 *
 */
export function ChatHeader({ children, className, ...props }: ChatHeaderProps) {
  return (
    <div
      className={cn(
        "bg-tertiary-bg sticky top-0 z-10 flex items-center gap-2 p-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ChatHeaderMainProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Primary content area of the header. Uses `flex-1` to take remaining
 * horizontal space between `ChatHeaderAddon` groups.
 *
 */
export function ChatHeaderMain({
  children,
  className,
  ...props
}: ChatHeaderMainProps) {
  return (
    <div className={cn("flex flex-1 items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}

export interface ChatHeaderAddonProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Groups supplementary items (avatars, buttons, inputs) on either side
 * of the header. Place one before `ChatHeaderMain` for the left side
 * and one after for the right side.
 *
 */
export function ChatHeaderAddon({
  children,
  className,
  ...props
}: ChatHeaderAddonProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {children}
    </div>
  );
}
