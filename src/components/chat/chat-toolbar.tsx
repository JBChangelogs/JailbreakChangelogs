/**
 * @module chat-toolbar
 *
 * Sticky bottom input area for message composition. Compose
 * `ChatToolbarTextarea`, `ChatToolbarAddon`, and `ChatToolbarButton`
 * inside a `ChatToolbar` container.
 *
 * Typical structure:
 * ```
 * ChatToolbar
 * ├── ChatToolbarAddon (align="inline-start")  ← left button(s)
 * │   └── ChatToolbarButton
 * ├── ChatToolbarTextarea                       ← auto-growing input
 * └── ChatToolbarAddon (align="inline-end")     ← right button(s)
 *     └── ChatToolbarButton (×N)
 * ```
 *
 * The `align` prop on `ChatToolbarAddon` controls position via CSS
 * `order`:
 * - `"inline-start"` → left of the textarea
 * - `"inline-end"` → right of the textarea
 * - `"block-start"` → full-width row above the textarea
 * - `"block-end"` → full-width row below the textarea
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface ChatToolbarProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Sticky bottom container for the message input and action buttons.
 * Renders a bordered, rounded inner wrapper with flex-wrap layout.
 *
 * @example
 * ```tsx
 * <ChatToolbar>
 *   <ChatToolbarAddon align="inline-start">
 *     <ChatToolbarButton><PlusIcon /></ChatToolbarButton>
 *   </ChatToolbarAddon>
 *
 *   <ChatToolbarTextarea
 *     value={message}
 *     onChange={(e) => setMessage(e.target.value)}
 *     onSubmit={() => handleSendMessage()}
 *   />
 *
 *   <ChatToolbarAddon align="inline-end">
 *     <ChatToolbarButton><GiftIcon /></ChatToolbarButton>
 *     <ChatToolbarButton><SendIcon /></ChatToolbarButton>
 *   </ChatToolbarAddon>
 * </ChatToolbar>
 * ```
 */
export function ChatToolbar({
  children,
  className,
  ...props
}: ChatToolbarProps) {
  return (
    <div
      className={cn("bg-tertiary-bg sticky bottom-0 p-2 pt-0", className)}
      {...props}
    >
      <div
        className={cn(
          "bg-primary-bg rounded-md border px-3 py-2",
          "flex flex-wrap items-start gap-x-2",
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Modifier key that allows inserting a new line instead of submitting */
const NEWLINE_MODIFIER_KEY = "shiftKey" as const;

export interface ChatToolbarTextareaProps extends React.ComponentProps<
  typeof Textarea
> {
  /** Called when the user presses Enter (without Shift). Use this to trigger message sending. */
  onSubmit?: () => void;
}

/**
 * Auto-growing textarea with built-in submit handling.
 *
 * - **Enter** → calls `onSubmit()`
 * - **Shift+Enter** → inserts a new line
 *
 * Accepts all standard `<textarea>` / shadcn `Textarea` props
 * (`value`, `onChange`, `placeholder`, etc.).
 *
 * @example
 * ```tsx
 * const [message, setMessage] = useState("");
 *
 * <ChatToolbarTextarea
 *   value={message}
 *   onChange={(e) => setMessage(e.target.value)}
 *   onSubmit={() => {
 *     sendMessage(message);
 *     setMessage("");
 *   }}
 * />
 * ```
 */
export function ChatToolbarTextarea({
  className,
  onSubmit,
  onKeyDown,
  ...props
}: ChatToolbarTextareaProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e[NEWLINE_MODIFIER_KEY]) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  return (
    <div className="order-2 grid min-w-0 flex-1">
      <Textarea
        id="toolbar-input"
        placeholder="Type your message..."
        className={cn(
          "h-fit max-h-30 min-h-10 px-1 @md/chat:text-base",
          "resize-none border-none shadow-none placeholder:whitespace-nowrap focus-visible:border-none focus-visible:ring-0",
          className,
        )}
        rows={1}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  );
}

const chatToolbarAddonAlignStyles = {
  "inline-start": "order-1",
  "inline-end": "order-3",
  "block-start": "order-0 w-full",
  "block-end": "order-4 w-full",
};

export interface ChatToolbarAddonProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
  /**
   * Position of this addon relative to the textarea.
   * - `"inline-start"` — left of the textarea (default)
   * - `"inline-end"` — right of the textarea
   * - `"block-start"` — full-width row above the textarea
   * - `"block-end"` — full-width row below the textarea
   */
  align?: "inline-start" | "inline-end" | "block-start" | "block-end";
}

/**
 * Groups action buttons at a specific position within the toolbar.
 * Use the `align` prop to control placement relative to the textarea.
 *
 * @example
 * ```tsx
 * // Left side
 * <ChatToolbarAddon align="inline-start">
 *   <ChatToolbarButton><PlusIcon /></ChatToolbarButton>
 * </ChatToolbarAddon>
 *
 * // Right side
 * <ChatToolbarAddon align="inline-end">
 *   <ChatToolbarButton><SendIcon /></ChatToolbarButton>
 * </ChatToolbarAddon>
 *
 * // Full-width row above
 * <ChatToolbarAddon align="block-start">
 *   <ChatToolbarButton><AttachIcon /></ChatToolbarButton>
 * </ChatToolbarAddon>
 * ```
 */
export function ChatToolbarAddon({
  children,
  className,
  align = "inline-start",
  ...props
}: ChatToolbarAddonProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-1.5",
        chatToolbarAddonAlignStyles[align],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ChatToolbarButtonProps extends React.ComponentProps<
  typeof Button
> {
  children?: React.ReactNode;
}

/**
 * Pre-styled ghost icon button for toolbar actions. Responsive sizing
 * via container queries. SVG icons inside are automatically sized.
 *
 * @example
 * ```tsx
 * <ChatToolbarButton>
 *   <SendIcon />
 * </ChatToolbarButton>
 * ```
 */
export function ChatToolbarButton({
  children,
  className,
  ...props
}: ChatToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "size-8 @md/chat:size-9 [&_svg]:stroke-[1.7px] [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='size-'])]:@md/chat:size-5",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
