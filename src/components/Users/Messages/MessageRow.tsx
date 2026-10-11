"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
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
import { useMediaQuery } from "@/hooks/useMediaQuery";

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
}

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
}: MessageRowProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [isMobileSheetOpen, setMobileSheetOpen] = useState(false);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      : selectedUser) ??
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
    const minute = Math.floor(message.createdAt / 60_000);
    const prevMinute = Math.floor(previousMessage.createdAt / 60_000);
    return minute === prevMinute;
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
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-tertiary-bg! !size-8 rounded-md p-0"
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
              <Icon icon="heroicons:ellipsis-horizontal" className="!size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">More message actions</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
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
              setActiveMessageId(message.id);
          }}
          onPointerDown={(event) => {
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
              "relative w-full flex-col items-start rounded-md py-0.5 transition-colors",
              editingMessageId === message.id
                ? "bg-tertiary-bg"
                : "lg:group-hover/message:bg-tertiary-bg",
              editingMessageId !== message.id &&
                (isMessageMenuActive || replyingToMessage?.id === message.id) &&
                "bg-quaternary-bg lg:bg-tertiary-bg",
              message.parentId && "mt-0.5",
            )}
          >
            {message.parentId && (
              <div className="-mb-1 flex items-center gap-2">
                <div className="relative w-10 shrink-0 self-stretch @md/chat:w-12">
                  <div className="border-secondary-text/40 absolute top-[calc(50%-1px)] -right-2 -bottom-0.5 left-[calc(50%-1px)] rounded-tl-md border-t-2 border-l-2" />
                </div>
                {(() => {
                  const parentMsg = messages.find(
                    (m) => m.id === message.parentId,
                  );
                  if (!parentMsg) {
                    return (
                      <div className="text-secondary-text/80 flex min-w-0 items-center gap-1.5 overflow-hidden rounded px-1 text-xs italic">
                        This message has been deleted
                      </div>
                    );
                  }
                  const isParentOwn =
                    asId(parentMsg.senderId) === asId(currentUser?.id);
                  const parentSender = isParentOwn
                    ? (currentUserEnriched ?? currentUserMessageUser)
                    : selectedUser;
                  const parentDisplayName = parentSender
                    ? getDisplayName(parentSender)
                    : "Unknown";
                  return (
                    <button
                      type="button"
                      className="text-secondary-text/80 flex min-w-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded px-1 text-xs transition-opacity hover:opacity-100"
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
                      <span className="text-primary-text shrink-0 font-semibold">
                        @{parentDisplayName}
                      </span>
                      <span className="text-secondary-text max-w-50 truncate sm:max-w-100">
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
                      className="text-secondary-text invisible text-[10px] lg:group-hover/message:visible"
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
                      size={7}
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
                        className="text-primary-text hover:text-link max-w-full cursor-pointer text-sm font-medium wrap-break-word transition-colors sm:text-base"
                      >
                        {getDisplayName(sender)}
                      </Link>
                      {typeof message.createdAt === "number" && (
                        <ChatEventTime
                          timestamp={message.createdAt}
                          format="discord"
                          className="text-secondary-text shrink-0 text-xs"
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
                          "wrap-break-word whitespace-pre-wrap",
                          message.status === "pending"
                            ? "text-secondary-text/70"
                            : message.status === "failed"
                              ? "text-form-error"
                              : "text-primary-text",
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
                            <span className="text-secondary-text ml-1.5 text-[10px]">
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
                    <div className="text-secondary-text mt-1 flex items-center gap-1.5 text-xs leading-tight">
                      <Icon icon="heroicons:eye" className="h-3.5 w-3.5" />
                      <span>Seen</span>
                    </div>
                  )}
              </ChatEventBody>
              {editingMessageId !== message.id && canOpenActions && (
                <Button
                  variant="ghost"
                  className={
                    isMessageMenuActive
                      ? "absolute top-0 right-0 !size-8 lg:hidden"
                      : "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:right-0 lg:hidden"
                  }
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
                <div
                  className={cn(
                    "border-border-card bg-secondary-bg pointer-events-none absolute top-0 right-2 z-10 hidden -translate-y-1/2 items-center gap-0.5 rounded-lg border p-0.5 opacity-0 shadow-md lg:flex lg:group-hover/message:pointer-events-auto lg:group-hover/message:opacity-100 lg:group-focus-within/message:pointer-events-auto lg:group-focus-within/message:opacity-100",
                    isMessageMenuActive && "pointer-events-auto opacity-100",
                  )}
                >
                  {message.status !== "failed" && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-tertiary-bg! !size-8"
                          aria-label="Reply to message"
                          disabled={isSending || !!deletingMessageId}
                          onClick={() => setReplyingToMessage(message)}
                        >
                          <Icon
                            icon="heroicons-outline:reply"
                            className="!size-4"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Reply</TooltipContent>
                    </Tooltip>
                  )}
                  {isOwnMessage &&
                    message.status !== "failed" &&
                    embedMetadata?.type !== "gift_sent" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-tertiary-bg! !size-8"
                            aria-label="Edit message"
                            disabled={isSending || !!deletingMessageId}
                            onClick={() => {
                              setEditingMessageId(message.id);
                            }}
                          >
                            <Icon
                              icon="heroicons-outline:pencil"
                              className="!size-4"
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit</TooltipContent>
                      </Tooltip>
                    )}
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
          side="bottom"
          overlayClassName="bg-black/20 backdrop-blur-none"
          className="bg-secondary-bg max-h-[80dvh] overflow-y-auto rounded-t-2xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
          aria-describedby={undefined}
          aria-labelledby={`message-actions-${domId}`}
          tabIndex={-1}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            (event.target as HTMLElement).focus();
          }}
        >
          <div className="bg-border-card mx-auto mb-4 h-1 w-10 rounded-full" />
          <SheetTitle id={`message-actions-${domId}`} className="sr-only">
            Message actions
          </SheetTitle>
          <div
            onClick={() => {
              setMobileSheetOpen(false);
              setActiveMessageId(null);
            }}
          >
            {renderMenuItems(MessageSheetAction, true)}
          </div>
        </SheetContent>
      </Sheet>
    </ContextMenu>
  );
}
