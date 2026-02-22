/**
 * @module chat
 *
 * Root container for the chat UI. Provides a flex column layout with
 * container query support (`@container/chat`) so child components can
 * adapt to the available width.
 *
 * **Important:** Give `Chat` or its parent a defined height or max-height (e.g. via
 * `className="h-screen"`) to enable proper scrolling in `ChatMessages`.
 *
 * @see {@link ChatHeader} for the sticky top header.
 * @see {@link ChatMessages} for the scrollable message area.
 * @see {@link ChatToolbar} for the sticky bottom input area.
 */

import { cn } from "@/lib/utils";

export interface ChatProps extends React.ComponentProps<"div"> {
  children?: React.ReactNode;
}

/**
 * Root container component that establishes the chat layout structure
 * with container queries and flex column layout for header, messages,
 * and toolbar sections.
 *
 * Uses container queries (e.g. `@md/chat:`, `@2xl/chat:`) to adapt
 * layout based on available width rather than viewport size.
 *
 * @example
 * ```tsx
 * <Chat className="h-screen">
 *   <ChatHeader>
 *     Header Content
 *   </ChatHeader>
 *
 *   <ChatMessages>
 *     Messages Content
 *   </ChatMessages>
 *
 *   <ChatToolbar>
 *     Toolbar Content
 *   </ChatToolbar>
 * </Chat>
 * ```
 */
export function Chat({ children, className, ...props }: ChatProps) {
  return (
    <div
      className={cn(
        "@container/chat flex h-full flex-col overflow-hidden",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
