"use client";

import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import Twemoji from "react-twemoji";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFrequentEmojis } from "@/hooks/useFrequentEmojis";
import {
  MENTION_SPLIT,
  mentionedIds,
  mentionsToText,
} from "@/utils/messages/mentions";
import {
  EMOJI_CELL,
  EmojiGlyph,
  EmojiGrid,
  ReactionChips,
} from "./MessageReactions";
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
import { UserProfilePopover } from "@/components/Users/UserProfilePopover";
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

function SheetSeparator() {
  return <div className="bg-border-primary/60 my-1 h-px" />;
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
  /** Toggles your reaction; leave out to hide reactions. */
  onReact?: (message: Message, emoji: string) => void;
  /** DMs: profiles for mentions (groups use usersById). */
  mentionUsers?: Map<string, MessageUser>;
}

/** Same key and shape as the app: an array of message ids, newest last. */
const ACKNOWLEDGED_READS_KEY = "jbcl:acknowledged-reads";
const READ_FLASH_MS = 4000;
const READ_FADE_MS = 500;

function acknowledgedReads(): string[] {
  try {
    const ids: unknown = JSON.parse(
      localStorage.getItem(ACKNOWLEDGED_READS_KEY) ?? "[]",
    );
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * "Read" under your newest read message: flashes for 4s, fades, then goes.
 * Acknowledged only once the whole flash has shown (a StrictMode re-run or
 * leaving mid-flash still shows it next time); then it never flashes again.
 */
function ReadReceipt({ messageId }: { messageId: string }) {
  const [phase, setPhase] = useState<"shown" | "fading" | "done">(() =>
    acknowledgedReads().includes(messageId) ? "done" : "shown",
  );
  const flashing = phase !== "done";
  useEffect(() => {
    if (!flashing) return;
    const fade = setTimeout(() => {
      setPhase("fading");
      try {
        const ids = acknowledgedReads().filter((id) => id !== messageId);
        localStorage.setItem(
          ACKNOWLEDGED_READS_KEY,
          JSON.stringify([...ids, messageId].slice(-500)),
        );
      } catch {
        // Flashes again next time.
      }
    }, READ_FLASH_MS);
    const done = setTimeout(
      () => setPhase("done"),
      READ_FLASH_MS + READ_FADE_MS,
    );
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [flashing, messageId]);
  if (phase === "done") return null;
  return (
    <div
      className={cn(
        "text-quaternary-text mt-0.5 flex items-center gap-1 text-[11px] leading-tight transition-opacity duration-500",
        phase === "fading" && "opacity-0",
      )}
    >
      <Icon icon="heroicons:eye" className="h-3 w-3" />
      <span>Read</span>
    </div>
  );
}

const MENTION_PILL =
  "bg-button-info/30 rounded-[3px] px-0.5 font-medium text-[color-mix(in_srgb,var(--color-button-info)_25%,white)]";

/** Message text with each <@id> as a pill linking to that profile. */
function MessageText({
  content,
  nameOf,
}: {
  content: string;
  nameOf: (id: string) => string | undefined;
}) {
  return formatMessageText(content)
    .split(MENTION_SPLIT)
    .map((part, index) => {
      if (index % 2 === 0) return part;
      const name = nameOf(part);
      return name ? (
        <UserProfilePopover key={index} user={{ id: part, username: name }}>
          <Link
            href={`/users/${part}`}
            prefetch={false}
            className={cn(
              MENTION_PILL,
              "hover:bg-button-info transition-colors hover:text-white",
            )}
          >
            @{name}
          </Link>
        </UserProfilePopover>
      ) : (
        <span key={index} className={MENTION_PILL}>
          @unknown-user
        </span>
      );
    });
}

const TOOLBAR_BUTTON =
  "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed";

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
  onReact,
  mentionUsers,
}: MessageRowProps) {
  const people = mentionUsers ?? usersById;
  const nameOf = (id: string) => {
    const user =
      people?.get(id) ??
      (selectedUser?.id === id ? selectedUser : undefined) ??
      (currentUserMessageUser?.id === id ? currentUserMessageUser : undefined);
    return user ? getDisplayName(user) : undefined;
  };
  const topEmojis = useFrequentEmojis(emojiStringMap, 4);
  const allEmojis = [...new Set(Object.values(emojiStringMap))];
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
        : groupEvent.type === "members_added" ||
            groupEvent.type === "member_joined"
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
        className="hover:bg-tertiary-bg mt-2 flex items-center gap-3 rounded px-4 py-1"
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
  // Someone else replying to one of yours.
  const isReplyToMe =
    !isOwnMessage &&
    !!message.parentId &&
    messages.some(
      (item) =>
        item.id === message.parentId &&
        !!currentUserId &&
        asId(item.senderId) === currentUserId,
    );
  // Highlighted like a reply to you, as Discord does.
  const mentionsMe =
    !isOwnMessage &&
    !!currentUserId &&
    mentionedIds(message.content).includes(currentUserId);
  const canOpenActions =
    message.status !== "pending" &&
    ((message.type !== "system" && !embedMetadata) ||
      message.status === "failed");
  const isLatestSeenOwnMessage =
    isOwnMessage &&
    typeof message.readAt === "number" &&
    !messages.slice(index + 1).some(isUserMessage);

  const canReact = !!onReact && canOpenActions && message.status !== "failed";
  const react = (emoji: string) => onReact?.(message, emoji);
  const plainText = () =>
    formatMessageText(mentionsToText(message.content ?? "", nameOf));
  const copy = (text: string) => void navigator.clipboard?.writeText(text);
  const busy = isSending || !!deletingMessageId;
  const canDelete = isOwnMessage || canDeleteOthers;

  const renderMenuItems = (
    Item: React.ComponentType<{
      onClick?: React.MouseEventHandler;
      className?: string;
      disabled?: boolean;
      children?: React.ReactNode;
    }>,
    Separator: React.ComponentType,
    skipShiftKey = false,
  ) => {
    if (!canOpenActions) return null;
    const danger =
      "text-button-danger focus:bg-button-danger/10 focus:text-button-danger";
    if (message.status === "failed")
      return isOwnMessage ? (
        <>
          {embedMetadata?.type !== "gift_sent" && (
            <Item
              disabled={busy}
              onClick={() => void handleRetryFailedMessage(message)}
            >
              <Icon icon="lucide:rotate-cw" className="mr-2 h-4 w-4" />
              Retry
            </Item>
          )}
          <Item
            disabled={busy}
            onClick={() => void handleDeleteMessage(message.id, true)}
            className={danger}
          >
            <Icon icon="heroicons-outline:trash" className="mr-2 h-4 w-4" />
            Remove
          </Item>
        </>
      ) : null;
    // The app's order: reply, edit, copy; then delete and report; then id.
    return (
      <>
        <Item disabled={busy} onClick={() => setReplyingToMessage(message)}>
          <Icon icon="heroicons-outline:reply" className="mr-2 h-4 w-4" />
          Reply
        </Item>
        {isOwnMessage && embedMetadata?.type !== "gift_sent" && (
          <Item disabled={busy} onClick={() => setEditingMessageId(message.id)}>
            <Icon icon="heroicons-outline:pencil" className="mr-2 h-4 w-4" />
            Edit
          </Item>
        )}
        <Item onClick={() => copy(plainText())}>
          <Icon
            icon="heroicons-outline:document-duplicate"
            className="mr-2 h-4 w-4"
          />
          Copy Text
        </Item>
        <Separator />
        {canDelete && (
          <Item
            disabled={busy}
            onClick={(e: React.MouseEvent) =>
              void handleDeleteMessage(
                message.id,
                skipShiftKey ? false : e.shiftKey,
              )
            }
            className={danger}
          >
            <Icon icon="heroicons-outline:trash" className="mr-2 h-4 w-4" />
            Delete
          </Item>
        )}
        {!isOwnMessage && (
          <Item
            disabled={busy}
            onClick={() => {
              setReportingMessage(message);
              setReportReason("");
            }}
            className={danger}
          >
            <Icon icon="heroicons-outline:flag" className="mr-2 h-4 w-4" />
            Report
          </Item>
        )}
        <Separator />
        <Item onClick={() => copy(message.id)}>
          <Icon
            icon="heroicons-outline:identification"
            className="mr-2 h-4 w-4"
          />
          Copy Message ID
        </Item>
      </>
    );
  };

  const messageMenu = (
    <DropdownMenu
      onOpenChange={(open) => setActiveMessageId(open ? message.id : null)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={TOOLBAR_BUTTON}
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
      <DropdownMenuContent align="end" className="w-52 p-1">
        {renderMenuItems(DropdownMenuItem, DropdownMenuSeparator)}
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
              "relative w-full flex-col items-start gap-0 rounded py-0.5 transition-colors duration-150",
              editingMessageId === message.id
                ? "bg-secondary-bg/60"
                : "lg:group-hover/message:bg-tertiary-bg",
              editingMessageId !== message.id &&
                (replyingToMessage?.id === message.id
                  ? "bg-button-info/10 lg:group-hover/message:bg-button-info/10 shadow-[inset_2px_0_0_var(--color-button-info)]"
                  : isReplyToMe || mentionsMe
                    ? "bg-status-warning/10 lg:group-hover/message:bg-status-warning/15 shadow-[inset_2px_0_0_var(--color-status-warning)]"
                    : isMessageMenuActive && "bg-tertiary-bg"),
              // A new sender (or a reply) starts with a little room, like the app.
              (!isGroupedWithPrevious || message.parentId) && "mt-2",
              // A reply's preview line is its own top padding.
              !isGroupedWithPrevious && !message.parentId && "pt-1",
            )}
          >
            {message.parentId && (
              <div className="flex h-5 w-full items-center gap-2">
                {/* The app's connector: from the avatar's centre up and
                    across to the parent, ending 4px short of its avatar and
                    2px above this message's (which sits 4px lower). */}
                <span className="relative h-full w-10 shrink-0 @md/chat:w-12">
                  <span
                    aria-hidden
                    className="border-tertiary-text/70 pointer-events-none absolute top-1/2 right-[-4px] bottom-[-2px] left-[calc(50%-1px)] -mt-px rounded-tl-md border-t-2 border-l-2"
                  />
                </span>
                {(() => {
                  const parentMsg = messages.find(
                    (m) => m.id === message.parentId,
                  );
                  if (!parentMsg) {
                    return (
                      <span className="text-tertiary-text min-w-0 text-sm">
                        Replying to a message
                      </span>
                    );
                  }
                  const isParentOwn =
                    asId(parentMsg.senderId) === asId(currentUser?.id);
                  const parentId = asId(parentMsg.senderId);
                  const parentSender = isParentOwn
                    ? (currentUserEnriched ?? currentUserMessageUser)
                    : userFor(parentId);
                  const parentLabel = parentSender
                    ? getDisplayName(parentSender)
                    : "unknown-user";
                  return (
                    <button
                      type="button"
                      className="text-tertiary-text flex min-w-0 flex-1 cursor-pointer items-center gap-1 text-left text-sm"
                      onClick={() => {
                        const el = document.getElementById(
                          `message-${getMessageDomId(parentMsg)}`,
                        );
                        if (!el) return;
                        // The app's jump: centre the parent and tint it.
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        el.classList.add("bg-status-info/15");
                        setTimeout(
                          () => el.classList.remove("bg-status-info/15"),
                          1500,
                        );
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
                      <span className="text-primary-text/90 shrink-0 font-medium">
                        @{parentLabel}
                      </span>
                      <span className="min-w-0 truncate">
                        {formatMessageText(
                          mentionsToText(parentMsg.content, nameOf),
                        ) || "(a message)"}
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
                  <UserProfilePopover user={sender}>
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
                  </UserProfilePopover>
                )}
              </ChatEventAddon>
              <ChatEventBody>
                {!isGroupedWithPrevious ? (
                  <ChatEventTitle className="w-full items-start">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <UserProfilePopover user={sender}>
                        <Link
                          href={`/users/${sender.id}`}
                          prefetch={false}
                          className="text-primary-text max-w-full cursor-pointer text-base font-semibold wrap-break-word hover:underline"
                        >
                          {getDisplayName(sender)}
                        </Link>
                      </UserProfilePopover>
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
                    mentionUsers={people ? [...people.values()] : undefined}
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
                            <MessageText
                              content={message.content ?? ""}
                              nameOf={nameOf}
                            />
                          </Twemoji>
                        ) : (
                          <MessageText
                            content={message.content ?? ""}
                            nameOf={nameOf}
                          />
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
                {editingMessageId !== message.id && (
                  <ReactionChips
                    reactions={message.reactions}
                    currentUserId={currentUserId}
                    nameOf={nameOf}
                    twemojiEnabled={twemojiEnabled}
                    onToggle={canReact ? react : undefined}
                  />
                )}
                {isLatestSeenOwnMessage &&
                  message.status !== "pending" &&
                  message.status !== "failed" && (
                    <ReadReceipt key={message.id} messageId={message.id} />
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
            </div>
            {editingMessageId !== message.id && canOpenActions && (
              // The app's hover bar, on the row's top edge (above a reply's
              // preview line): quick reactions, the picker, then "…".
              <div
                className={cn(
                  "border-border-primary bg-secondary-bg absolute -top-1 right-7 z-10 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border p-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 lg:flex",
                  isMessageMenuActive && "opacity-100",
                )}
              >
                {canReact && (
                  <>
                    {topEmojis.slice(0, 3).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={`React with ${emoji}`}
                        className={cn(TOOLBAR_BUTTON, "text-base")}
                        onClick={() => react(emoji)}
                      >
                        <EmojiGlyph
                          emoji={emoji}
                          twemojiEnabled={twemojiEnabled}
                        />
                      </button>
                    ))}
                    <span className="bg-border-primary mx-0.5 h-4 w-px" />
                    <Popover>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label="Add reaction"
                              className={TOOLBAR_BUTTON}
                            >
                              <Icon
                                icon="heroicons:face-smile"
                                className="size-4"
                              />
                            </button>
                          </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">Add Reaction</TooltipContent>
                      </Tooltip>
                      <PopoverContent align="end" className="w-auto p-1.5">
                        <EmojiGrid
                          emojis={allEmojis}
                          twemojiEnabled={twemojiEnabled}
                          renderCell={(emoji, glyph) => (
                            <button
                              key={emoji}
                              type="button"
                              aria-label={`React with ${emoji}`}
                              className={EMOJI_CELL}
                              onClick={() => react(emoji)}
                            >
                              {glyph}
                            </button>
                          )}
                        />
                      </PopoverContent>
                    </Popover>
                  </>
                )}
                {messageMenu}
              </div>
            )}
          </ChatEvent>
        </div>
      </ContextMenuTrigger>
      {canOpenActions && (
        <ContextMenuContent className="w-52">
          {canReact && (
            <>
              <div className="flex gap-1 p-1">
                {topEmojis.map((emoji) => (
                  <ContextMenuItem
                    key={emoji}
                    aria-label={`React with ${emoji}`}
                    className="bg-tertiary-bg h-9 flex-1 justify-center p-0 text-lg"
                    onClick={() => react(emoji)}
                  >
                    <EmojiGlyph emoji={emoji} twemojiEnabled={twemojiEnabled} />
                  </ContextMenuItem>
                ))}
              </div>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <Icon icon="heroicons-outline:face-smile" className="mr-2" />
                  Add Reaction
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="p-1.5">
                  <EmojiGrid
                    emojis={allEmojis}
                    twemojiEnabled={twemojiEnabled}
                    renderCell={(emoji, glyph) => (
                      <ContextMenuItem
                        key={emoji}
                        aria-label={`React with ${emoji}`}
                        className={EMOJI_CELL}
                        onClick={() => react(emoji)}
                      >
                        {glyph}
                      </ContextMenuItem>
                    )}
                  />
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />
            </>
          )}
          {renderMenuItems(ContextMenuItem, ContextMenuSeparator, true)}
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
              {canReact && (
                <div className="flex gap-1 py-1">
                  {topEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`React with ${emoji}`}
                      className="bg-tertiary-bg flex h-11 flex-1 cursor-pointer items-center justify-center rounded-md text-xl"
                      onClick={() => react(emoji)}
                    >
                      <EmojiGlyph
                        emoji={emoji}
                        twemojiEnabled={twemojiEnabled}
                      />
                    </button>
                  ))}
                </div>
              )}
              {renderMenuItems(MessageSheetAction, SheetSeparator, true)}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ContextMenu>
  );
}
