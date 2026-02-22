/**
 * @module chat-event
 *
 * Composable components for rendering a single message or event row
 * inside `ChatMessages`. Build different message layouts (primary
 * messages, follow-ups, date separators) by combining these primitives.
 *
 * Typical structure for a primary message:
 * ```
 * ChatEvent
 * ├── ChatEventAddon   ← side column (avatar)
 * │   └── ChatEventAvatar
 * └── ChatEventBody    ← main content (flex-1)
 *     ├── ChatEventTitle
 *     │   ├── sender name
 *     │   └── ChatEventTime
 *     └── ChatEventContent
 * ```
 *
 * Typical structure for a follow-up (additional) message:
 * ```
 * ChatEvent
 * ├── ChatEventAddon   ← side column (hover timestamp)
 * │   └── ChatEventTime (visible on group-hover)
 * └── ChatEventBody
 *     └── ChatEventContent
 * ```
 *
 * Typical structure for a date separator:
 * ```
 * ChatEvent
 * ├── Separator
 * ├── ChatEventTime (format="longDate")
 * └── Separator
 * ```
 *
 * @see {@link ChatMessages} for the parent scrollable container.
 */

import { cn } from "@/lib/utils";
import {
  AvatarFallbackProps,
  AvatarImageProps,
  AvatarProps,
} from "@radix-ui/react-avatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMemo } from "react";

/**
 * Preset format names for `ChatEventTime`.
 *
 * - `"time"` — short time only (e.g. "12:30 PM")
 * - `"date"` — medium date (e.g. "Jan 1, 2024")
 * - `"dateTime"` — date + time (e.g. "Jan 1, 2024, 12:30 PM")
 * - `"longDate"` — long date (e.g. "January 1, 2024")
 * - `"relative"` — relative time (e.g. "2 hours ago", "yesterday")
 */
export type ChatEventTimeFormat =
  | "time"
  | "date"
  | "dateTime"
  | "longDate"
  | "relative";

export interface ChatEventTimeProps extends React.ComponentProps<"time"> {
  /** Unix timestamp (ms) or Date object. */
  timestamp: number | Date;
  /** Preset display format. Defaults to `"dateTime"`. */
  format?: ChatEventTimeFormat;
  /** BCP 47 locale string. Defaults to the browser locale. */
  locale?: string;
  /** Custom `Intl.DateTimeFormat` options — overrides the `format` preset. */
  formatOptions?: Intl.DateTimeFormatOptions;
}

const FORMAT_PRESETS: Record<ChatEventTimeFormat, Intl.DateTimeFormatOptions> =
  {
    time: { timeStyle: "short" },
    date: { dateStyle: "medium" },
    dateTime: { dateStyle: "medium", timeStyle: "short" },
    longDate: { dateStyle: "long" },
    relative: { dateStyle: "medium", timeStyle: "short" },
  };

export type ChatEventProps = React.ComponentProps<"div">;

/**
 * Flex row wrapper for a single message or event. Each event typically
 * contains a `ChatEventAddon` (side column) and a `ChatEventBody`
 * (main content area).
 *
 * @example
 * ```tsx
 * // Primary message
 * <ChatEvent className="hover:bg-accent">
 *   <ChatEventAddon>
 *     <ChatEventAvatar src="/avatar.png" alt="@user" fallback="AS" />
 *   </ChatEventAddon>
 *   <ChatEventBody>
 *     <ChatEventTitle>
 *       <span className="font-medium">Ann Smith</span>
 *       <ChatEventTime timestamp={1700000000000} />
 *     </ChatEventTitle>
 *     <ChatEventContent>Hello, world!</ChatEventContent>
 *   </ChatEventBody>
 * </ChatEvent>
 *
 * // Follow-up message (same sender, no avatar)
 * <ChatEvent className="hover:bg-accent group">
 *   <ChatEventAddon>
 *     <ChatEventTime
 *       timestamp={1700000000000}
 *       format="time"
 *       className="text-right text-[8px] group-hover:visible invisible"
 *     />
 *   </ChatEventAddon>
 *   <ChatEventBody>
 *     <ChatEventContent>Another message from the same sender.</ChatEventContent>
 *   </ChatEventBody>
 * </ChatEvent>
 *
 * // Date separator
 * <ChatEvent className="items-center gap-1 my-4">
 *   <Separator className="flex-1" />
 *   <ChatEventTime
 *     timestamp={1700000000000}
 *     format="longDate"
 *     className="font-semibold min-w-max"
 *   />
 *   <Separator className="flex-1" />
 * </ChatEvent>
 * ```
 */
export function ChatEvent({ children, className, ...props }: ChatEventProps) {
  return (
    <div className={cn("flex gap-2 px-2", className)} {...props}>
      {children}
    </div>
  );
}

export type ChatEventAddonProps = React.ComponentProps<"div">;

/**
 * Fixed-width side column within a `ChatEvent`. Typically holds a
 * `ChatEventAvatar` for primary messages or a `ChatEventTime` for
 * follow-up messages. Responsive width via container queries.
 *
 * @example
 * ```tsx
 * <ChatEventAddon>
 *   <ChatEventAvatar src="/avatar.png" fallback="AS" />
 * </ChatEventAddon>
 * ```
 */
export function ChatEventAddon({
  children,
  className,
  ...props
}: ChatEventAddonProps) {
  return (
    <div
      className={cn(
        "flex h-full w-10 shrink-0 justify-center pt-1 @md/chat:w-12",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type ChatEventBodyProps = React.ComponentProps<"div">;

/**
 * Main content area within a `ChatEvent`. Uses `flex-1` to fill the
 * remaining space beside `ChatEventAddon`. Contains `ChatEventTitle`
 * and `ChatEventContent`.
 *
 * @example
 * ```tsx
 * <ChatEventBody>
 *   <ChatEventTitle>
 *     <span className="font-medium">Ann Smith</span>
 *     <ChatEventTime timestamp={1700000000000} />
 *   </ChatEventTitle>
 *   <ChatEventContent>Hello, world!</ChatEventContent>
 * </ChatEventBody>
 * ```
 */
export function ChatEventBody({
  children,
  className,
  ...props
}: ChatEventBodyProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)} {...props}>
      {children}
    </div>
  );
}

export type ChatEventContentProps = React.ComponentProps<"div">;

/**
 * Message text container with responsive text sizing via container
 * queries (`text-sm` → `@md/chat:text-base`).
 *
 * @example
 * ```tsx
 * <ChatEventContent>Hello, world!</ChatEventContent>
 * ```
 */
export function ChatEventContent({
  children,
  className,
  ...props
}: ChatEventContentProps) {
  return (
    <div className={cn("text-sm @md/chat:text-base", className)} {...props}>
      {children}
    </div>
  );
}

export type ChatEventTitleProps = React.ComponentProps<"div">;

/**
 * Row for the sender name and metadata (e.g. timestamp, badges).
 * Typically the first child of `ChatEventBody`.
 *
 * @example
 * ```tsx
 * <ChatEventTitle>
 *   <span className="font-medium">Ann Smith</span>
 *   <ChatEventTime timestamp={1700000000000} />
 * </ChatEventTitle>
 * ```
 */
export function ChatEventTitle({
  children,
  className,
  ...props
}: ChatEventTitleProps) {
  return (
    <div
      className={cn("flex items-center gap-2 text-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ChatEventAvatarProps extends AvatarProps {
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
 * Avatar sized for message rows. Responsive sizing via container
 * queries (`size-8` → `@md/chat:size-10`). Built on Radix UI Avatar
 * primitives.
 *
 * @example
 * ```tsx
 * <ChatEventAvatar
 *   src="https://example.com/avatar.png"
 *   alt="@annsmith"
 *   fallback="AS"
 * />
 * ```
 */
export function ChatEventAvatar({
  className,
  src,
  alt,
  fallback,
  imageProps,
  fallbackProps,
  ...props
}: ChatEventAvatarProps) {
  return (
    <Avatar
      className={cn("size-8 rounded-full @md/chat:size-10", className)}
      {...props}
    >
      <AvatarImage src={src} alt={alt} {...imageProps} />
      {fallback && (
        <AvatarFallback {...fallbackProps}>{fallback}</AvatarFallback>
      )}
    </Avatar>
  );
}

function getRelativeTimeString(date: Date, locale: string): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, "second");
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute");
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour");
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return rtf.format(-diffInDays, "day");
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Locale-aware timestamp display with preset and custom formatting.
 * Renders a semantic `<time>` element with an ISO `dateTime` attribute.
 *
 * Preset formats:
 * - `"time"` — short time (e.g. "12:30 PM")
 * - `"date"` — medium date (e.g. "Jan 1, 2024")
 * - `"dateTime"` — date + time (e.g. "Jan 1, 2024, 12:30 PM") **(default)**
 * - `"longDate"` — long date (e.g. "January 1, 2024")
 * - `"relative"` — relative time (e.g. "2 hours ago", "yesterday")
 *
 * @example
 * ```tsx
 * // Inline timestamp in a title row
 * <ChatEventTime timestamp={1700000000000} />
 *
 * // Time-only format for follow-up messages
 * <ChatEventTime
 *   timestamp={1700000000000}
 *   format="time"
 *   className="text-right text-[8px] group-hover:visible invisible"
 * />
 *
 * // Long date format for date separators
 * <ChatEventTime
 *   timestamp={1700000000000}
 *   format="longDate"
 *   className="font-semibold min-w-max"
 * />
 * ```
 */
export function ChatEventTime({
  timestamp,
  format = "dateTime",
  locale,
  formatOptions,
  className,
  ...props
}: ChatEventTimeProps) {
  const date = useMemo(
    () => (timestamp instanceof Date ? timestamp : new Date(timestamp)),
    [timestamp],
  );

  const resolvedLocale =
    locale ?? (typeof navigator !== "undefined" ? navigator.language : "en-US");

  const formattedTime = useMemo(() => {
    if (format === "relative") {
      return getRelativeTimeString(date, resolvedLocale);
    }

    const options = formatOptions ?? FORMAT_PRESETS[format];
    return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
  }, [date, format, formatOptions, resolvedLocale]);

  const isoString = useMemo(() => date.toISOString(), [date]);

  return (
    <time
      dateTime={isoString}
      className={cn("text-muted-foreground text-xs", className)}
      {...props}
    >
      {formattedTime}
    </time>
  );
}
