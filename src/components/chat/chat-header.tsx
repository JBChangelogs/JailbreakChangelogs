/**
 * @module chat-header
 *
 * Sticky header components for the chat UI. Compose `ChatHeaderMain`,
 * `ChatHeaderAddon`, `ChatHeaderAvatar`, and `ChatHeaderButton` inside
 * a `ChatHeader` container to build the header layout.
 *
 * Typical structure:
 * ```
 * ChatHeader
 * ├── ChatHeaderAddon          ← left-side items (avatar, back button)
 * ├── ChatHeaderMain           ← center content (takes remaining space)
 * └── ChatHeaderAddon          ← right-side items (action buttons)
 * ```
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  AvatarFallbackProps,
  AvatarImageProps,
  AvatarProps,
} from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface ChatHeaderProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Sticky header container for the chat. Renders as a flex row pinned
 * to the top of the `Chat` container.
 *
 * @example
 * ```tsx
 * <ChatHeader className="border-b">
 *   <ChatHeaderAddon>
 *     <ChatHeaderAvatar src="/avatar.png" alt="@user" fallback="AS" />
 *   </ChatHeaderAddon>
 *   <ChatHeaderMain>
 *     <span className="font-medium">Ann Smith</span>
 *   </ChatHeaderMain>
 *   <ChatHeaderAddon>
 *     <ChatHeaderButton><PhoneIcon /></ChatHeaderButton>
 *     <ChatHeaderButton><MoreHorizontalIcon /></ChatHeaderButton>
 *   </ChatHeaderAddon>
 * </ChatHeader>
 * ```
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
 * @example
 * ```tsx
 * <ChatHeaderMain>
 *   <span className="font-medium">Ann Smith</span>
 *   <span className="flex-1 grid">
 *     <span className="text-sm font-medium truncate">Front-end developer</span>
 *   </span>
 * </ChatHeaderMain>
 * ```
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
 * @example
 * ```tsx
 * // Left side
 * <ChatHeaderAddon>
 *   <ChatHeaderAvatar src="/avatar.png" alt="@user" fallback="AS" />
 * </ChatHeaderAddon>
 *
 * // Right side
 * <ChatHeaderAddon>
 *   <ChatHeaderButton><PhoneIcon /></ChatHeaderButton>
 *   <ChatHeaderButton><VideoIcon /></ChatHeaderButton>
 * </ChatHeaderAddon>
 * ```
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

export interface ChatHeaderAvatarProps extends AvatarProps {
  className?: string;
  /** Image URL for the avatar. */
  src?: AvatarImageProps["src"];
  /** Alt text for the avatar image. */
  alt?: string;
  /** Fallback content shown while the image loads or if it fails (e.g. initials). */
  fallback?: React.ReactNode;
  /** Additional props forwarded to the inner `AvatarImage`. */
  imageProps?: AvatarImageProps;
  /** Additional props forwarded to the inner `AvatarFallback`. */
  fallbackProps?: AvatarFallbackProps;
}

/**
 * Avatar component sized for the header. Built on Radix UI Avatar
 * primitives with rounded styling.
 *
 * @example
 * ```tsx
 * <ChatHeaderAvatar
 *   src="https://example.com/avatar.png"
 *   alt="@annsmith"
 *   fallback="AS"
 * />
 * ```
 */
export function ChatHeaderAvatar({
  className,
  src,
  alt,
  fallback,
  imageProps,
  fallbackProps,
  ...props
}: ChatHeaderAvatarProps) {
  return (
    <Avatar className={cn("rounded-full", className)} {...props}>
      <AvatarImage src={src} alt={alt} {...imageProps} />
      {fallback && (
        <AvatarFallback {...fallbackProps}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

export interface ChatHeaderButtonProps extends React.ComponentProps<
  typeof Button
> {
  children?: React.ReactNode;
}

/**
 * Pre-styled ghost icon button for header actions (phone, video, menu, etc.).
 * Uses `variant="ghost"` and `size="icon-sm"`.
 *
 * @example
 * ```tsx
 * <ChatHeaderButton>
 *   <MoreHorizontalIcon />
 * </ChatHeaderButton>
 * ```
 */
export function ChatHeaderButton({
  children,
  className,
  ...props
}: ChatHeaderButtonProps) {
  return (
    <Button variant="ghost" size="icon" className={cn(className)} {...props}>
      {children}
    </Button>
  );
}
