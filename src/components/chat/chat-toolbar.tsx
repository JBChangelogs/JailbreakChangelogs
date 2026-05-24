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
import { CommentTextarea } from "@/components/PageComments/CommentTextarea";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";

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
          "bg-secondary-bg rounded-md border px-3 py-2",
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
  /** Optional overlay rendered inside the textarea container (right side). */
  rightOverlay?: React.ReactNode;
  /** Optional className applied to the overlay wrapper. */
  rightOverlayClassName?: string;
  /** Shows a top drag handle to resize the textarea vertically. */
  showResizeHandle?: boolean;
  /** Enables `:shortcode:` emoji autocomplete when non-empty. */
  emojiMap?: EmojiStringMap;
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
  rightOverlay,
  rightOverlayClassName,
  showResizeHandle = false,
  onKeyDown,
  onChange,
  value,
  emojiMap,
  ...props
}: ChatToolbarTextareaProps) {
  const hasEmojiAutocomplete = Boolean(
    emojiMap && Object.keys(emojiMap).length > 0,
  );
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [manualHeight, setManualHeight] = React.useState<number | null>(null);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const baseHeightRef = React.useRef(40);
  const isExpandedRef = React.useRef(false);
  const autosizeRafRef = React.useRef<number | null>(null);
  const resizeStateRef = React.useRef<{
    startY: number;
    startHeight: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!showResizeHandle) return;
    if (manualHeight !== null) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    baseHeightRef.current = Math.max(
      40,
      Math.ceil(textarea.getBoundingClientRect().height),
    );
  }, [manualHeight, showResizeHandle]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e[NEWLINE_MODIFIER_KEY]) {
      e.preventDefault();
      onSubmit?.();
    }
    onKeyDown?.(e);
  };

  const clampHeight = React.useCallback((height: number) => {
    const minHeight = baseHeightRef.current;
    const maxHeight =
      typeof window !== "undefined"
        ? Math.max(
            minHeight,
            Math.min(240, Math.floor(window.innerHeight * 0.4)),
          )
        : 240;
    return Math.min(maxHeight, Math.max(minHeight, height));
  }, []);

  const autosize = React.useCallback(() => {
    if (showResizeHandle && manualHeight !== null) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = clampHeight(textarea.scrollHeight);
    textarea.style.height = `${nextHeight}px`;
    const shouldExpand = nextHeight > baseHeightRef.current + 2;
    if (shouldExpand !== isExpandedRef.current) {
      isExpandedRef.current = shouldExpand;
      setIsExpanded(shouldExpand);
    }
  }, [clampHeight, manualHeight, showResizeHandle]);

  const scheduleAutosize = React.useCallback(() => {
    if (typeof window === "undefined") return;
    if (autosizeRafRef.current !== null) {
      window.cancelAnimationFrame(autosizeRafRef.current);
    }
    autosizeRafRef.current = window.requestAnimationFrame(() => {
      autosizeRafRef.current = null;
      autosize();
    });
  }, [autosize]);

  React.useLayoutEffect(() => {
    scheduleAutosize();
    return () => {
      if (autosizeRafRef.current !== null && typeof window !== "undefined") {
        window.cancelAnimationFrame(autosizeRafRef.current);
      }
      autosizeRafRef.current = null;
    };
  }, [scheduleAutosize, value]);

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!showResizeHandle) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;

    const textarea = textareaRef.current;
    const currentHeight =
      manualHeight ??
      (textarea ? Math.ceil(textarea.getBoundingClientRect().height) : 40);
    resizeStateRef.current = {
      startY: e.clientY,
      startHeight: currentHeight,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = resizeStateRef.current;
    if (!state) return;
    const delta = state.startY - e.clientY;
    setManualHeight(clampHeight(state.startHeight + delta));
    e.preventDefault();
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeStateRef.current) return;
    resizeStateRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    e.preventDefault();
  };

  return (
    <div className="relative order-2 min-w-0 flex-1">
      {showResizeHandle ? (
        <div
          className="pointer-events-auto absolute -top-3 right-0 left-0 z-20 hidden h-4 items-center justify-center lg:flex"
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          onDoubleClick={() => setManualHeight(null)}
          role="separator"
          aria-orientation="horizontal"
        >
          <div className="bg-border-card/80 hover:bg-border-card h-1 w-10 cursor-ns-resize rounded-full transition-colors" />
        </div>
      ) : null}

      <div className="relative grid">
        {hasEmojiAutocomplete ? (
          <CommentTextarea
            id="toolbar-input"
            placeholder="Type your message..."
            ref={textareaRef}
            value={typeof value === "string" ? value : ""}
            onChange={(next) => {
              onChange?.({
                target: { value: next },
                currentTarget: { value: next },
              } as React.ChangeEvent<HTMLTextAreaElement>);
              scheduleAutosize();
            }}
            emojiMap={emojiMap!}
            className={cn(
              "h-fit max-h-60 min-h-10 w-full @md/chat:text-base",
              "resize-none overflow-y-auto bg-transparent p-2 text-sm text-inherit shadow-none",
              "border-none placeholder:whitespace-nowrap focus:outline-none",
              rightOverlay ? "pr-20" : "",
              className,
            )}
            rows={1}
            style={
              manualHeight
                ? ({ height: manualHeight } satisfies React.CSSProperties)
                : undefined
            }
            onKeyDown={handleKeyDown}
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            autoCapitalize="off"
            {...props}
          />
        ) : (
          <Textarea
            id="toolbar-input"
            placeholder="Type your message..."
            ref={textareaRef}
            className={cn(
              "h-fit max-h-60 min-h-10 @md/chat:text-base",
              "resize-none overflow-y-auto bg-transparent p-2 text-sm text-inherit shadow-none",
              "border-none placeholder:whitespace-nowrap focus-visible:border-none focus-visible:ring-0 focus-visible:outline-none",
              rightOverlay ? "pr-20" : "",
              className,
            )}
            rows={1}
            style={
              manualHeight
                ? ({ height: manualHeight } satisfies React.CSSProperties)
                : undefined
            }
            value={value}
            onChange={(event) => {
              onChange?.(event);
              scheduleAutosize();
            }}
            onKeyDown={handleKeyDown}
            {...props}
          />
        )}
        {rightOverlay ? (
          <div
            className={cn(
              isExpanded
                ? "absolute top-[6px] right-2"
                : "absolute top-1/2 right-2 -translate-y-1/2",
              rightOverlayClassName,
            )}
          >
            {rightOverlay}
          </div>
        ) : null}
      </div>
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
