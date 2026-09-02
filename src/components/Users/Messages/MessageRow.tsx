"use client";

import type React from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChatEvent,
  ChatEventAddon,
  ChatEventBody,
  ChatEventContent,
  ChatEventTime,
  ChatEventTitle,
} from "@/components/chat/chat-event";
import { CommentTextarea } from "@/components/PageComments/CommentTextarea";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import type { EmojiStringMap } from "@/utils/comments/emojiShortcodes";
import type { Message, MessageUser } from "@/utils/messages/types";
import { asId } from "@/utils/messages/parsing";
import {
  formatMessageText,
  formatSystemMessageContent,
  getDayKey,
  getDisplayName,
} from "@/utils/messages/formatting";
import { getMessageDomId } from "@/utils/messages/sorting";

interface MessageRowProps {
  message: Message;
  index: number;
  messages: Message[];
  currentUser: UserData | null;
  currentUserEnriched: MessageUser | null;
  currentUserMessageUser: MessageUser | null;
  selectedUser: MessageUser | null;
  activeMessageId: string | null;
  editingMessageId: string | null;
  editContent: string;
  editEmojiOpen: boolean;
  emojiStringMap: EmojiStringMap;
  twemojiEnabled: boolean;
  isSending: boolean;
  deletingMessageId: string | null;
  editCursorPosRef: RefObject<number | null>;
  editTextareaRef: RefObject<HTMLTextAreaElement | null>;
  messagesContainerRef: RefObject<HTMLDivElement | null>;
  setActiveMessageId: Dispatch<SetStateAction<string | null>>;
  setEditingMessageId: Dispatch<SetStateAction<string | null>>;
  setEditContent: Dispatch<SetStateAction<string>>;
  setEditEmojiOpen: Dispatch<SetStateAction<boolean>>;
  setReplyingToMessage: Dispatch<SetStateAction<Message | null>>;
  setReportingMessage: Dispatch<SetStateAction<Message | null>>;
  setReportReason: Dispatch<SetStateAction<string>>;
  handleDeleteMessage: (
    messageId: string,
    skipConfirmation?: boolean,
  ) => void | Promise<void>;
  handleRetryFailedMessage: (message: Message) => void | Promise<void>;
  handleEditMessage: (messageId: string) => void | Promise<void>;
  insertEditEmoji: (emoji: string, keepOpen?: boolean) => void;
}

export function MessageRow({
  message,
  index,
  messages,
  currentUser,
  currentUserEnriched,
  currentUserMessageUser,
  selectedUser,
  activeMessageId,
  editingMessageId,
  editContent,
  editEmojiOpen,
  emojiStringMap,
  twemojiEnabled,
  isSending,
  deletingMessageId,
  editCursorPosRef,
  editTextareaRef,
  messagesContainerRef,
  setActiveMessageId,
  setEditingMessageId,
  setEditContent,
  setEditEmojiOpen,
  setReplyingToMessage,
  setReportingMessage,
  setReportReason,
  handleDeleteMessage,
  handleRetryFailedMessage,
  handleEditMessage,
  insertEditEmoji,
}: MessageRowProps) {
  if (message.type === "system") {
    const systemContent = formatSystemMessageContent(
      message,
      currentUser ? asId(currentUser.id) : null,
      selectedUser ?? null,
    );
    return (
      <ChatEvent
        key={message.id}
        className="border-link bg-button-info/10 my-0.5 items-start rounded-l-none rounded-r-md border-l-2 py-0.5 pl-2"
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
          <ChatEventContent className="text-primary-text wrap-break-word whitespace-pre-wrap">
            {formatMessageText(systemContent)}
          </ChatEventContent>
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

  const renderMenuItems = (
    Item: React.ComponentType<{
      onClick?: React.MouseEventHandler;
      className?: string;
      children?: React.ReactNode;
    }>,
    skipShiftKey = false,
  ) => (
    <>
      {message.status !== "failed" && (
        <Item onClick={() => setReplyingToMessage(message)}>
          <Icon icon="heroicons-outline:reply" className="mr-2 h-4 w-4" />
          Reply
        </Item>
      )}
      {!isOwnMessage && message.status !== "failed" && (
        <Item
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
          <Item
            onClick={() => {
              setEditingMessageId(message.id);
              setEditContent(message.content);
            }}
          >
            <Icon icon="heroicons-outline:pencil" className="mr-2 h-4 w-4" />
            Edit Message
          </Item>
          <Item
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
          <Item onClick={() => void handleRetryFailedMessage(message)}>
            <Icon icon="lucide:rotate-cw" className="mr-2 h-4 w-4" />
            Retry
          </Item>
          <Item
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "pointer-events-none !size-7 rounded-lg p-0 opacity-0 transition-all duration-200 data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 sm:!size-8 lg:opacity-0 lg:group-hover:pointer-events-auto lg:group-hover:opacity-100 lg:disabled:opacity-0 lg:group-hover:disabled:opacity-100",
            isMessageMenuActive && "pointer-events-auto opacity-100",
          )}
          disabled={
            isSending ||
            Boolean(deletingMessageId) ||
            message.status === "pending"
          }
        >
          <Icon icon="heroicons:ellipsis-horizontal" className="!size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {renderMenuItems(DropdownMenuItem)}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <ContextMenu key={domId}>
      <ContextMenuTrigger asChild>
        <div id={`message-${domId}`} className="group" data-message-row>
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
              "group-hover:bg-tertiary-bg relative w-full flex-col items-start rounded-md py-0.5 transition-colors",
              message.parentId && "mt-0.5",
            )}
            onClick={(event) => {
              if (editingMessageId) return;
              if (message.status === "pending") return;

              const target = event.target as HTMLElement | null;
              if (
                target?.closest(
                  "a,button,textarea,input,select,[role='menuitem']",
                )
              ) {
                return;
              }

              setActiveMessageId((prev) =>
                prev === message.id ? null : message.id,
              );
            }}
          >
            {message.parentId && (
              <div className="-mb-1 flex items-center gap-2 sm:gap-3">
                <div className="flex w-10 shrink-0 justify-end @md/chat:w-12">
                  <div className="border-secondary-text/40 h-3 w-8 translate-x-2 translate-y-2 rounded-tl-md border-t-2 border-l-2" />
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
                      className="text-secondary-text invisible text-[10px] group-hover:visible"
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
                    <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                      <Link
                        href={`/users/${sender.id}`}
                        prefetch={false}
                        className="text-primary-text hover:text-link cursor-pointer truncate text-sm font-medium transition-colors sm:text-base"
                      >
                        {getDisplayName(sender)}
                      </Link>
                      {typeof message.createdAt === "number" && (
                        <ChatEventTime
                          timestamp={message.createdAt}
                          format="discord"
                          className="text-secondary-text text-xs"
                        />
                      )}
                    </div>
                  </ChatEventTitle>
                ) : null}
                {editingMessageId === message.id ? (
                  <div className="mt-2 space-y-2">
                    <div className="border-border-card bg-tertiary-bg focus-within:border-button-info rounded border transition-colors">
                      <CommentTextarea
                        ref={editTextareaRef}
                        value={editContent}
                        onChange={setEditContent}
                        emojiMap={emojiStringMap}
                        disabled={isSending}
                        rows={3}
                        className="text-primary-text placeholder-secondary-text w-full resize-y bg-transparent p-3 text-sm focus:outline-none disabled:opacity-60"
                        autoCorrect="off"
                        autoComplete="off"
                        spellCheck="false"
                        autoCapitalize="off"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setEditingMessageId(null);
                            setEditContent("");
                          }
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void handleEditMessage(message.id);
                          }
                        }}
                      />
                      <div className="border-border-card flex items-center justify-between gap-2 border-t px-3 py-2">
                        <Popover
                          open={editEmojiOpen}
                          onOpenChange={setEditEmojiOpen}
                        >
                          <Tooltip delayDuration={500}>
                            <TooltipTrigger asChild>
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-secondary-text hover:text-primary-text h-7 w-7 p-0"
                                  disabled={isSending}
                                  onPointerDown={() => {
                                    editCursorPosRef.current =
                                      editTextareaRef.current?.selectionStart ??
                                      null;
                                  }}
                                >
                                  <Icon
                                    icon="heroicons:face-smile"
                                    className="h-4 w-4"
                                  />
                                </Button>
                              </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Add an emoji</TooltipContent>
                          </Tooltip>
                          <PopoverContent
                            align="start"
                            side="top"
                            sideOffset={8}
                            className="w-72 p-0"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                          >
                            <div className="grid max-h-56 grid-cols-8 gap-px overflow-y-auto p-1.5">
                              {Object.entries(emojiStringMap)
                                .slice(0, 120)
                                .map(([name, emoji]) => (
                                  <Tooltip key={name} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <button
                                        type="button"
                                        onClick={(e) =>
                                          insertEditEmoji(emoji, e.shiftKey)
                                        }
                                        className="hover:bg-quaternary-bg flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-transparent text-lg transition-colors"
                                      >
                                        {twemojiEnabled ? (
                                          <Twemoji
                                            tag="span"
                                            options={{
                                              className:
                                                "twemoji pointer-events-none",
                                            }}
                                          >
                                            {emoji}
                                          </Twemoji>
                                        ) : (
                                          <span className="pointer-events-none">
                                            {emoji}
                                          </span>
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>:{name}:</TooltipContent>
                                  </Tooltip>
                                ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        <div className="flex items-center gap-2 lg:hidden">
                          <Button
                            size="sm"
                            className="h-8 px-4 text-xs"
                            onClick={() => void handleEditMessage(message.id)}
                            disabled={isSending || !editContent.trim()}
                          >
                            {isSending ? (
                              <Spinner className="mr-1 h-3 w-3" />
                            ) : null}
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-secondary-text h-8 px-4 text-xs"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent("");
                            }}
                            disabled={isSending}
                          >
                            Cancel
                          </Button>
                        </div>
                        <div className="text-secondary-text hidden items-center gap-1 text-[11px] lg:flex">
                          Esc to{" "}
                          <button
                            type="button"
                            className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => {
                              setEditingMessageId(null);
                              setEditContent("");
                            }}
                            disabled={isSending}
                          >
                            cancel
                          </button>{" "}
                          • Enter to{" "}
                          <button
                            type="button"
                            className="text-link cursor-pointer hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => void handleEditMessage(message.id)}
                            disabled={isSending || !editContent.trim()}
                          >
                            save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <ChatEventContent
                        className={cn(
                          "wrap-break-word whitespace-pre-wrap",
                          message.status === "pending"
                            ? "text-secondary-text/70"
                            : message.status === "failed"
                              ? "text-red-400/90"
                              : "text-primary-text",
                        )}
                      >
                        {twemojiEnabled ? (
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
              </ChatEventBody>
              {editingMessageId !== message.id &&
                message.status !== "pending" && (
                  <div className="absolute top-0 right-0 z-10">
                    {messageMenu}
                  </div>
                )}
            </div>
          </ChatEvent>
        </div>
      </ContextMenuTrigger>
      {message.status !== "pending" && (
        <ContextMenuContent>
          {renderMenuItems(ContextMenuItem, true)}
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
