/**
 * @module chat-messages
 *
 * Scrollable message container for the chat UI. Uses `flex-col-reverse`
 * to display messages bottom-to-top and automatically scroll to the
 * latest message. Fills all available vertical space between the header
 * and toolbar.
 *
 * **Important:** The parent `Chat` component or its parent must have a defined height
 * for overflow scrolling to work correctly.
 *
 * @see {@link ChatEvent} for rendering individual messages inside this container.
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ChatMessagesProps = React.ComponentProps<"div">;

/**
 * Scrollable flex container with reverse column direction that
 * displays chat messages from bottom to top, automatically handling
 * overflow.
 *
 * Render `ChatEvent` items (or custom message components built from
 * them) as direct children. Because of `flex-col-reverse`, the first
 * child in the DOM appears at the **bottom** of the visible area.
 *
 * @example
 * ```tsx
 * <ChatMessages>
 *   {messages.map((msg) => (
 *     <ChatEvent key={msg.id}>
 *       <ChatEventAddon>
 *         <ChatEventAvatar src={msg.sender.avatarUrl} fallback="AB" />
 *       </ChatEventAddon>
 *       <ChatEventBody>
 *         <ChatEventTitle>
 *           <span className="font-medium">{msg.sender.name}</span>
 *           <ChatEventTime timestamp={msg.timestamp} />
 *         </ChatEventTitle>
 *         <ChatEventContent>{msg.content}</ChatEventContent>
 *       </ChatEventBody>
 *     </ChatEvent>
 *   ))}
 * </ChatMessages>
 * ```
 */
export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-1 flex-col-reverse overflow-auto py-2",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ChatMessages.displayName = "ChatMessages";
