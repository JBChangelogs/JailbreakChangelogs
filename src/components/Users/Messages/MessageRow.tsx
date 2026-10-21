"use client";

import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import Link from "next/link";
import Twemoji from "react-twemoji";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle,
} from "@/components/chat/chat-event";
import { Icon } from "@/components/ui/IconWrapper";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";
import type { Message, MessageUser } from "@/utils/messages/types";
import { asId, parseOfferAcceptedMetadata } from "@/utils/messages/parsing";
import {
  describeGroupEvent,
  parseGroupEvent,
} from "@/utils/messages/groupEvents";
import type { useOfferDetailsBatch } from "@/hooks/useOfferDetailsBatch";
import {
  formatMessageText,
  formatSystemMessageContent,
  getDayKey,
  getDisplayName,
} from "@/utils/messages/formatting";
import { getMessageDomId } from "@/utils/messages/sorting";
import { isUserMessage, parseMessageEmbed } from "@/utils/messages/invites";
import { MessageEmbedCard } from "./MessageEmbedCard";
import { OfferAcceptedCard } from "./OfferAcceptedCard";
import { MessageEditor } from "./MessageEditor";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  BottomPanelHeader,
  useBottomPanel,
} from "@/components/ui/bottom-panel";

function MessageSheetAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      className={cn("min-h-12 w-full justify-start px-3", className)}
      {...props}
    />
  );
}

interface MessageRowProps {
  message: Message;
  offerDetails: ReturnType<typeof useOfferDetailsBatch>;
  index: number;
  messages: Message[];
  currentUser: UserData | null;
  currentUserEnriched: MessageUser | null;
  currentUserMessageUser: MessageUser | null;
  selectedUser: MessageUser | null;
  activeMessageId: string | null;
  replyingToMessage: Message | null;
  editingMessageId: string | null;
  emojiStringMap: EmojiStringMap;
  twemojiEnabled: boolean;
  isSending: boolean;
  deletingMessageId: string | null;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  setActiveMessageId: Dispatch<SetStateAction<string | null>>;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  setReplyingToMessage: Dispatch<SetStateAction<Message | null>>;
  setReportingMessage: Dispatch<SetStateAction<Message | null>>;
  setReportReason: Dispatch<SetStateAction<string>>;
  handleDeleteMessage: (
    messageId: string,
    skipConfirmation?: boolean,
  ) => void | Promise<void>;
  handleRetryFailedMessage: (message: Message) => void | Promise<void>;
  handleEditMessage: (
    messageId: string,
    content: string,
  ) => void | Promise<void>;
  /** Group chats: each member's profile, to show who sent each message. */
  usersById?: Map<string, MessageUser>;
  /** Group owners can delete anyone's message. */
  canDeleteOthers?: boolean;
}

/** Messages this close together from one sender share a header, like the app. */
const GROUP_GAP_MS = 5 * 60_000;

/** A member whose profile hasn't loaded yet. */
const placeholderUser = (id: string): MessageUser => ({
  id,
  username: `User #${id.slice(-6)}`,
  avatar: "",
});

export function MessageRow({
  message,
  offerDetails,
  index,
  messages,
  currentUser,
  currentUserEnriched,
  currentUserMessageUser,
  selectedUser,
  activeMessageId,
  replyingToMessage,
  editingMessageId,
  emojiStringMap,
  twemojiEnabled,
  isSending,
  deletingMessageId,
  messagesContainerRef,
  setActiveMessageId,
  setEditingMessageId,
  setReplyingToMessage,
  setReportingMessage,
  setReportReason,
  handleDeleteMessage,
  handleRetryFailedMessage,
  handleEditMessage,
  usersById,
  canDeleteOthers = false,
}: MessageRowProps) {
  // In a group, a sender is any member; in a DM, the other person.
  const userFor = (id: string): MessageUser | null =>
    usersById ? (usersById.get(id) ?? placeholderUser(id)) : selectedUser;
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const closeMessageActions = () => {
    setMobileSheetOpen(false);
    setActiveMessageId(null);
  };
  const bottomPanel = useBottomPanel(
    "message actions",
    "(max-width: 1023px)",
    "content",
    closeMessageActions,
  );
  const { isMobile } = bottomPanel;
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);
  const touchStartRef = useRef({ x: 0, y: 0 });
  const cancelLongPress = () => {
    if (longPressRef.current !== null) clearTimeout(longPressRef.current);
    longPressRef.current = null;
  };
  useEffect(
    () => cancelLongPress,
    [message.id, isMobile, isSending, deletingMessageId, editingMessageId],
  );

  const acceptedOffer = parseOfferAcceptedMetadata(message.metadata);
  const embedMetadata = parseMessageEmbed(message.metadata);

  // A group's rename or membership change: a centred line, Discord style,
  // with no actions (the API won't edit them).
  const groupEvent = usersById ? parseGroupEvent(message.metadata) : null;
  if (groupEvent) {
    const nameOf = (id: string) => {
      const user =
        currentUser && id === asId(currentUser.id)
          ? currentUserMessageUser
          : usersById?.get(id);
      return user ? getDisplayName(user) : `User #${id.slice(-6)}`;
    };
    // The app's colours: a darkened green for joins, red for leaving.
    const [icon, tone] =
      groupEvent.type === "group_renamed"
        ? ["heroicons:pencil", "text-tertiary-text"]
        : groupEvent.type === "members_added"
          ? [
              "heroicons:arrow-right",
              "text-[color-mix(in_srgb,var(--color-status-success)_70%,black)]",
            ]
          : [
              "heroicons:arrow-left",
              "text-[color-mix(in_srgb,var(--color-status-error)_70%,black)]",
            ];
    return (
      <div
        id={`message-${getMessageDomId(message)}`}
        data-message-row
        className="hover:bg-secondary-bg/60 mt-2 flex items-center gap-3 rounded px-4 py-1"
      >
        <span className="flex w-9 shrink-0 justify-center">
          <Icon
            icon={icon}
            aria-hidden="true"
            className={cn("size-4.5", tone)}
          />
        </span>
        <p className="text-tertiary-text min-w-0 flex-1 text-sm">
          {describeGroupEvent(groupEvent, asId(message.senderId), nameOf).map(
            (part, index) =>
              typeof part === "string" ? (
                <Fragment key={index}>{part}</Fragment>
              ) : part.userId ? (
                <Link
                  key={index}
                  href={`/users/${part.userId}`}
                  prefetch={false}
                  className="text-primary-text font-semibold hover:underline"
                >
                  {part.strong}
                </Link>
              ) : (
                <span key={index} className="text-primary-text font-semibold">
                  {part.strong}
                </span>
              ),
          )}{" "}
          {typeof message.createdAt === "number" && (
            <ChatEventTime
              timestamp={message.createdAt}
              format="discord"
              className="text-quaternary-text text-xs"
            />
          )}
        </p>
      </div>
    );
  }
  if (acceptedOffer || (message.type === "system" && !embedMetadata)) {
    const systemContent = formatSystemMessageContent(
      message,
      currentUser ? asId(currentUser.id) : null,
      selectedUser ?? null,
    );
    return (
      <ChatEvent
        key={message.id}
        id={`message-${getMessageDomId(message)}`}
        data-message-row
        className={
          acceptedOffer
            ? "group/message lg:hover:bg-tertiary-bg items-start rounded-md py-1.5 transition-colors"
            : "border-link bg-button-info/10 my-0.5 items-start rounded-l-none rounded-r-md border-l-2 py-0.5 pl-2"
        }
      >
        <ChatEventAddon>
          <div className="bg-tertiary-bg border-border-card text-link inline-flex h-7 w-7 items-center justify-center rounded-md border">
            <Icon icon="lucide:bot" className="h-4 w-4" />
          </div>
        </ChatEventAddon>
        <ChatEventBody>
          <ChatEventTitle>
            <span className="text-link text-xs font-medium sm:text-sm">
              System
            </span>
            {typeof message.createdAt === "number" && (
              <ChatEventTime
                timestamp={message.createdAt}
                format="discord"
                className="text-secondary-text text-xs"
              />
            )}
          </ChatEventTitle>
          {acceptedOffer ? (
            <OfferAcceptedCard
              metadata={acceptedOffer}
              currentUserId={currentUser ? asId(currentUser.id) : null}
              offerDetails={offerDetails}
            />
          ) : (
            <ChatEventContent className="text-primary-text wrap-break-word whitespace-pre-wrap">
              {formatMessageText(systemContent)}
            </ChatEventContent>
          )}
        </ChatEventBody>
      </ChatEvent>
    );
  }

  const currentUserId = currentUser ? asId(currentUser.id) : "";
  const senderId = asId(message.senderId);
  const isOwnMessage = !!currentUserId && senderId === currentUserId;
  const sender =
    (isOwnMessage && currentUser
      ? (currentUserEnriched ?? currentUserMessageUser)
      : userFor(senderId)) ??
    selectedUser ??
    currentUserMessageUser;
  if (!sender) {
    return null;
  }
  const currentDayKey = getDayKey(message.createdAt);
  const previousDayKey = getDayKey(messages[index - 1]?.createdAt);
  const showDaySeparator = !!currentDayKey && currentDayKey !== previousDayKey;
  const domId = getMessageDomId(message);
  const previousMessage = messages[index - 1];
  const isGroupedWithPrevious = (() => {
    if (embedMetadata || parseMessageEmbed(previousMessage?.metadata))
      return false;
    if (showDaySeparator) return false;
    if (!previousMessage) return false;
    if (message.parentId) return false;
    if (previousMessage.type === "system") return false;
    if (
      typeof message.createdAt !== "number" ||
      typeof previousMessage.createdAt !== "number"
    ) {
      return false;
    }
    if (asId(previousMessage.senderId) !== senderId) {
      return false;
    }
    return message.createdAt - previousMessage.createdAt <= GROUP_GAP_MS;
  })();

  const isMessageMenuActive = activeMessageId === message.id;
  const canOpenActions =
    message.status !== "pending" &&
    ((message.type !== "system" && !embedMetadata) ||
      message.status === "failed");
  const isLatestSeenOwnMessage =
    isOwnMessage &&
    typeof message.readAt === "number" &&
    !messages.slice(index + 1).some(isUserMessage);

  const renderMenuItems = (
    Item: React.ComponentType<{
      onClick?: React.MouseEventHandler;
      className?: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }>,
    skipShiftKey = false,
  ) =>
    !canOpenActions ? null : (
      <>
        {message.status !== "failed" && (
          <Item
            disabled={isSending || !!deletingMessageId}
            onClick={() => setReplyingToMessage(message)}
          >
            <Icon icon="heroicons-outline:reply" className="mr-2 h-4 w-4" />
            Reply
          </Item>
        )}
        {!isOwnMessage && message.status !== "failed" && (
          <Item
            disabled={isSending || !!deletingMessageId}
            onClick={() => {
              setReportingMessage(message);
              setReportReason("");
            }}
            className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
          >
            <Icon icon="heroicons-outline:flag" className="mr-2 h-4 w-4" />
            Report Message
          </Item>
        )}
        {!isOwnMessage && canDeleteOthers && message.status !== "failed" && (
          <Item
            disabled={isSending || !!deletingMessageId}
            onClick={(e: React.MouseEvent) =>
              void handleDeleteMessage(
                message.id,
                skipShiftKey ? false : e.shiftKey,
              )
            }
            className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
          >
            <Icon icon="heroicons-outline:trash" className="mr-2 h-4 w-4" />
            Delete Message
          </Item>
        )}
        {isOwnMessage && message.status !== "failed" && (
          <>
            {embedMetadata?.type !== "gift_sent" && (
              <Item
                disabled={isSending || !!deletingMessageId}
                onClick={() => {
                  setEditingMessageId(message.id);
                }}
              >
                <Icon
                  icon="heroicons-outline:pencil"
                  className="mr-2 h-4 w-4"
                />
                Edit Message
              </Item>
            )}
            <Item
              disabled={isSending || !!deletingMessageId}
              onClick={(e: React.MouseEvent) =>
                void handleDeleteMessage(
                  message.id,
                  skipShiftKey ? false : e.shiftKey,
                )
              }
              className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
            >
              <Icon icon="heroicons-outline:trash" className="mr-2 h-4 w-4" />
              Delete Message
            </Item>
          </>
        )}
        {isOwnMessage && message.status === "failed" && (
          <>
            {embedMetadata?.type !== "gift_sent" && (
              <Item
                disabled={isSending || !!deletingMessageId}
                onClick={() => void handleRetryFailedMessage(message)}
              >
                <Icon icon="lucide:rotate-cw" className="mr-2 h-4 w-4" />
                Retry
              </Item>
            )}
            <Item
              disabled={isSending || !!deletingMessageId}
              onClick={() => void handleDeleteMessage(message.id, true)}
              className="text-button-danger focus:bg-button-danger/10 focus:text-button-danger"
            >
              <Icon icon="heroicons-outline:trash" className="mr-2 h-4 w-4" />
              Remove
            </Item>
          </>
        )}
      </>
    );

  const messageMenu = (
    <DropdownMenu
      onOpenChange={(open) => setActiveMessageId(open ? message.id : null)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "border-border-primary bg-secondary-bg text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border opacity-0 transition-opacity group-hover/message:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed",
                isMessageMenuActive && "opacity-100",
              )}
              aria-label="More message actions"
              disabled={
                isSending ||
                Boolean(deletingMessageId) ||
                message.status === "pending" ||
                (embedMetadata?.type === "gift_sent" &&
                  message.id === message.clientId &&
                  message.status !== "failed")
              }
            >
              <Icon icon="heroicons:ellipsis-horizontal" className="size-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">More message actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-40 p-1">
        {renderMenuItems(DropdownMenuItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <ContextMenu
      key={domId}
      onOpenChange={(open) => setActiveMessageId(open ? message.id : null)}
    >
      <ContextMenuTrigger
        asChild
        disabled={
          isMobile || isSending || !!deletingMessageId || !canOpenActions
        }
      >
        <div
          id={`message-${domId}`}
          className="group/message"
          data-message-row
          onClick={(event) => {
            if (didLongPressRef.current) {
              didLongPressRef.current = false;
              return;
            }
            if (
              isMobile &&
              !isSending &&
              !deletingMessageId &&
              !editingMessageId &&
              canOpenActions &&
              !(event.target as HTMLElement).closest(
                "a,button,textarea,input,select,[role='menuitem']",
              )
            )
              setActiveMessageId((current) =>
                current === message.id ? null : message.id,
              );
          }}
          onPointerDown={(event) => {
            didLongPressRef.current = false;
            if (
              !isMobile ||
              event.pointerType === "mouse" ||
              isSending ||
              deletingMessageId ||
              editingMessageId ||
              !canOpenActions
            )
              return;
            if (
              (event.target as HTMLElement).closest(
                "a,button,textarea,input,select,[role='menuitem']",
              )
            )
              return;
            cancelLongPress();
            touchStartRef.current = { x: event.clientX, y: event.clientY };
            longPressRef.current = setTimeout(() => {
              longPressRef.current = null;
              didLongPressRef.current = true;
              setActiveMessageId(message.id);
            }, 500);
          }}
          onPointerMove={(event) => {
            if (
              Math.hypot(
                event.clientX - touchStartRef.current.x,
                event.clientY - touchStartRef.current.y,
              ) > 8
            )
              cancelLongPress();
          }}
          onPointerUp={cancelLongPress}
          onPointerCancel={cancelLongPress}
        >
          {showDaySeparator && typeof message.createdAt === "number" && (
            <ChatEvent className="items-center gap-2 py-2">
              <div className="border-secondary-text/30 flex-1 border-t" />
              <ChatEventTime
                timestamp={message.createdAt}
                format="longDate"
                className="text-secondary-text min-w-max text-xs font-semibold"
              />
              <div className="border-secondary-text/30 flex-1 border-t" />
            </ChatEvent>
          )}
          <ChatEvent
            className={cn(
              "relative w-full flex-col items-start rounded py-0.5 transition-colors duration-150",
              editingMessageId === message.id
                ? "bg-secondary-bg/60"
                : "lg:group-hover/message:bg-secondary-bg/60",
              editingMessageId !== message.id &&
                (isMessageMenuActive || replyingToMessage?.id === message.id) &&
                "bg-secondary-bg/60",
              // A new sender (or a reply) starts with a little room, like the app.
              (!isGroupedWithPrevious || message.parentId) && "mt-2 pt-1",
            )}
          >
            {message.parentId && (
              <div className="flex items-center">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 56 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-tertiary-text h-3 w-14 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9V2h34"
                  />
                </svg>
                {(() => {
                  const parentMsg = messages.find(
                    (m) => m.id === message.parentId,
                  );
                  if (!parentMsg) {
                    return (
                      <div className="text-tertiary-text flex min-w-0 items-center gap-1 text-xs">
                        Replying to a message
                      </div>
                    );
                  }
                  const isParentOwn =
                    asId(parentMsg.senderId) === asId(currentUser?.id);
                  const parentSender = isParentOwn
                    ? (currentUserEnriched ?? currentUserMessageUser)
                    : userFor(asId(parentMsg.senderId));
                  const parentDisplayName = parentSender
                    ? getDisplayName(parentSender)
                    : "Unknown";
                  return (
                    <button
                      type="button"
                      className="text-tertiary-text hover:text-secondary-text flex min-w-0 cursor-pointer items-center gap-1 text-left text-xs transition-colors"
                      onClick={() => {
                        const el = document.getElementById(
                          `message-${getMessageDomId(parentMsg)}`,
                        );
                        const container = messagesContainerRef.current;
                        if (el && container) {
                          const rect = el.getBoundingClientRect();
                          const containerRect =
                            container.getBoundingClientRect();

                          const isVisible =
                            rect.top >= containerRect.top &&
                            rect.bottom <= containerRect.bottom;

                          if (!isVisible) {
                            const relativeTop =
                              el.offsetTop - container.offsetTop;
                            container.scrollTo({
                              top:
                                relativeTop -
                                container.clientHeight / 2 +
                                el.clientHeight / 2,
                              behavior: "smooth",
                            });
                          }
                          el.classList.add(
                            "bg-button-info/10",
                            "transition-colors",
                            "duration-500",
                          );
                          setTimeout(
                            () =>
                              el.classList.remove(
                                "bg-button-info/10",
                                "transition-colors",
                                "duration-500",
                              ),
                            1500,
                          );
                        }
                      }}
                    >
                      {parentSender && (
                        <UserAvatar
                          userId={parentSender.id}
                          bgClassName="bg-tertiary-bg"
                          avatarHash={parentSender.avatar}
                          username={parentSender.username}
                          custom_avatar={parentSender.custom_avatar}
                          size={4}
                          showBadge={false}
                          settings={parentSender.settings_v2}
                          premiumType={parentSender.premiumtype}
                          className="h-4 w-4"
                        />
                      )}
                      <span className="text-secondary-text shrink-0 font-medium">
                        {parentDisplayName}
                      </span>
                      <span className="min-w-0 truncate">
                        {formatMessageText(parentMsg.content)}
                      </span>
                    </button>
                  );
                })()}
              </div>
            )}
            <div className="relative flex w-full items-start gap-2">
              <ChatEventAddon
                className={cn(
                  isGroupedWithPrevious ? "justify-end pr-1" : undefined,
                )}
              >
                {isGroupedWithPrevious ? (
                  typeof message.createdAt === "number" ? (
                    <ChatEventTime
                      timestamp={message.createdAt}
                      format="time"
                      className="text-quaternary-text invisible text-[10px] lg:group-hover/message:visible"
                    />
                  ) : null
                ) : (
                  <Link
                    href={`/users/${sender.id}`}
                    prefetch={false}
                    className="cursor-pointer"
                    aria-label={`View ${getDisplayName(sender)} profile`}
                  >
                    <UserAvatar
                      userId={sender.id}
                      bgClassName="bg-tertiary-bg"
                      avatarHash={sender.avatar}
                      username={sender.username}
                      custom_avatar={sender.custom_avatar}
                      size={9}
                      showBadge={false}
                      settings={sender.settings_v2}
                      premiumType={sender.premiumtype}
                    />
                  </Link>
                )}
              </ChatEventAddon>
              <ChatEventBody>
                {!isGroupedWithPrevious ? (
                  <ChatEventTitle className="w-full items-start">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Link
                        href={`/users/${sender.id}`}
                        prefetch={false}
                        className="text-primary-text max-w-full cursor-pointer text-base font-semibold wrap-break-word hover:underline"
                      >
                        {getDisplayName(sender)}
                      </Link>
                      {typeof message.createdAt === "number" && (
                        <ChatEventTime
                          timestamp={message.createdAt}
                          format="discord"
                          className="text-tertiary-text shrink-0 text-xs"
                        />
                      )}
                    </div>
                  </ChatEventTitle>
                ) : null}
                {editingMessageId === message.id ? (
                  <MessageEditor
                    key={message.id}
                    message={message}
                    emojiStringMap={emojiStringMap}
                    twemojiEnabled={twemojiEnabled}
                    isSending={isSending}
                    onSave={handleEditMessage}
                    onCancel={() => setEditingMessageId(null)}
                  />
                ) : (
                  <div className="flex w-full items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <ChatEventContent
                        data-message-content
                        className={cn(
                          "text-base wrap-break-word whitespace-pre-wrap",
                          message.status === "pending"
                            ? "text-primary-text/50"
                            : message.status === "failed"
                              ? "text-status-error"
                              : "text-primary-text/90",
                        )}
                      >
                        {embedMetadata ? (
                          <MessageEmbedCard
                            message={message}
                            metadata={embedMetadata}
                            isMine={isOwnMessage}
                            senderLabel={getDisplayName(sender)}
                          />
                        ) : twemojiEnabled ? (
                          <Twemoji
                            tag="span"
                            options={{
                              className: "twemoji",
                            }}
                          >
                            {formatMessageText(message.content ?? "")}
                          </Twemoji>
                        ) : (
                          formatMessageText(message.content ?? "")
                        )}
                        {message.updatedAt &&
                          message.updatedAt !== message.createdAt && (
                            <span className="text-quaternary-text ml-1 text-xs">
                              (edited)
                            </span>
                          )}
                      </ChatEventContent>
                    </div>
                  </div>
                )}
                {isLatestSeenOwnMessage &&
                  message.status !== "pending" &&
                  message.status !== "failed" && (
                    <div className="text-quaternary-text mt-0.5 flex items-center gap-1 text-[11px] leading-tight">
                      <Icon icon="heroicons:eye" className="h-3 w-3" />
                      <span>Read</span>
                    </div>
                  )}
              </ChatEventBody>
              {editingMessageId !== message.id && canOpenActions && (
                <Button
                  variant="ghost"
                  className={cn(
                    isMessageMenuActive
                      ? "absolute right-0 !size-8 lg:hidden"
                      : "sr-only focus:not-sr-only focus:absolute focus:right-0 lg:hidden",
                    isGroupedWithPrevious
                      ? "top-1/2 -translate-y-1/2"
                      : "top-0",
                  )}
                  aria-label="Message actions"
                  aria-haspopup="dialog"
                  disabled={isSending || !!deletingMessageId}
                  onClick={() => {
                    setActiveMessageId(message.id);
                    setMobileSheetOpen(true);
                  }}
                >
                  <Icon
                    icon="heroicons:ellipsis-horizontal"
                    className="!size-4"
                  />
                </Button>
              )}
              {editingMessageId !== message.id && canOpenActions && (
                // The app's single "…" button, shown on hover.
                <div className="absolute top-0 right-2 z-10 hidden -translate-y-1/2 lg:block">
                  {messageMenu}
                </div>
              )}
            </div>
          </ChatEvent>
        </div>
      </ContextMenuTrigger>
      {canOpenActions && (
        <ContextMenuContent>
          {renderMenuItems(ContextMenuItem, true)}
        </ContextMenuContent>
      )}
      <Sheet
        open={
          isMobile && isMessageMenuActive && canOpenActions && isMobileSheetOpen
        }
        onOpenChange={(open) => {
          setMobileSheetOpen(open);
          if (!open) setActiveMessageId(null);
        }}
      >
        <SheetContent
          side={bottomPanel.sheet.side}
          style={bottomPanel.sheet.style}
          overlayClassName="bg-black/20 backdrop-blur-none"
          className={cn(
            "bg-secondary-bg flex flex-col gap-0 p-0 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none",
            bottomPanel.sheet.className,
          )}
          aria-describedby={undefined}
          aria-labelledby={`message-actions-${domId}`}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.target as HTMLElement).focus();
          }}
        >
          <BottomPanelHeader
            handle={bottomPanel.handle}
            showCloseButton={false}
          >
            <SheetTitle id={`message-actions-${domId}`} className="sr-only">
              Message actions
            </SheetTitle>
          </BottomPanelHeader>
          {!bottomPanel.collapsed && (
            <div
              className="min-h-0 overflow-y-auto px-4"
              onClick={closeMessageActions}
            >
              {renderMenuItems(MessageSheetAction, true)}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ContextMenu>
  );
}
