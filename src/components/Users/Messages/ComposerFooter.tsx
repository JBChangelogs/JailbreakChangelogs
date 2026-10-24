"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useEffect, useMemo, useRef } from "react";
import { BanBanner } from "@/components/ui/BanBanner";
import { Icon } from "@/components/ui/IconWrapper";
import { MessageComposer } from "@/components/Users/MessageComposer";
import { ComposerActionsMenu } from "./ComposerActionsMenu";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { SupporterGift, UserData } from "@/types/auth";
import {
  MESSAGE_CHAR_LIMIT,
  type Message,
  type MessageUser,
  type OutgoingMessageMetadata,
} from "@/utils/messages/types";
import { asId } from "@/utils/messages/parsing";
import { getDisplayName } from "@/utils/messages/formatting";
import type { BanInfo } from "@/utils/api/ban";

const TYPING_DOTS = ["[animation-delay:-0.3s]", "[animation-delay:-0.15s]", ""];

/** "A is typing…", "A and B are typing…", or "Several people are typing…". */
function TypingText({ users }: { users: MessageUser[] }) {
  const name = (user: MessageUser) => (
    <span className="font-semibold">
      {user.username || getDisplayName(user)}
    </span>
  );
  if (users.length === 1) return <>{name(users[0])} is typing…</>;
  if (users.length === 2) {
    return (
      <>
        {name(users[0])} and {name(users[1])} are typing…
      </>
    );
  }
  return <>Several people are typing…</>;
}

interface ComposerBarProps {
  messageBan: BanInfo | null;
  /** The message being replied to, and who sent it. */
  replying: { message: Message; sender: MessageUser | null } | null;
  onCancelReply: () => void;
  /** Who @ can mention. */
  mentionCandidates: MessageUser[];
  /** Who is typing now; the line expands while anyone is. */
  typingUsers: MessageUser[];
  conversationId: string | null;
  placeholder: string;
  isSending: boolean;
  disabled: boolean;
  /** The "+" menu: invites, servers, gifts. */
  actions?: ReactNode;
  onSend: (
    message: string,
    metadata?: OutgoingMessageMetadata,
  ) => void | Promise<void>;
  onTyping: () => void;
}

/**
 * The message box under a chat, laid out like the desktop app's: who is
 * typing, the reply bar, then the rounded input with its actions. Shared by
 * DMs and group chats.
 */
export function ComposerBar({
  messageBan,
  replying,
  onCancelReply,
  mentionCandidates,
  typingUsers,
  conversationId,
  placeholder,
  isSending,
  disabled,
  actions,
  onSend,
  onTyping,
}: ComposerBarProps) {
  const composerRef = useRef<HTMLDivElement>(null);
  const replyingTo = replying?.message ?? null;
  useEffect(() => {
    if (!replyingTo) return;
    // Focus after the message menu closes and restores focus.
    const frame = requestAnimationFrame(() => {
      const textarea = composerRef.current?.querySelector("textarea");
      if (!textarea || textarea.disabled) return;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [replyingTo]);

  return (
    <div className="bg-primary-bg relative flex shrink-0 flex-col justify-center px-2 pb-2">
      <div
        aria-live="polite"
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          typingUsers.length ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="text-secondary-text flex items-center gap-2 overflow-hidden px-2 text-xs">
          {typingUsers.length > 0 && (
            <>
              <span className="flex h-3 shrink-0 items-center gap-[2px]">
                {TYPING_DOTS.map((delay) => (
                  <span
                    key={delay}
                    className={cn(
                      "animate-typing-dot bg-tertiary-text h-1 w-1 rounded-full",
                      delay,
                    )}
                  />
                ))}
              </span>
              {typingUsers.length === 1 && (
                <UserAvatar
                  userId={typingUsers[0].id}
                  avatarHash={typingUsers[0].avatar}
                  username={typingUsers[0].username}
                  custom_avatar={typingUsers[0].custom_avatar}
                  size={4}
                  showBadge={false}
                  settings={typingUsers[0].settings_v2}
                  premiumType={typingUsers[0].premiumtype}
                />
              )}
              <span className="truncate py-1.5">
                <TypingText users={typingUsers} />
              </span>
            </>
          )}
        </div>
      </div>
      {messageBan && <BanBanner ban={messageBan} className="mb-2" />}
      {replyingTo && (
        <div className="border-border-card bg-tertiary-bg flex items-center gap-2 rounded-t-xl border-x border-t px-3 py-1.5 transition-all duration-200 ease-out starting:translate-y-1 starting:opacity-0">
          <Icon
            icon="heroicons:arrow-uturn-left"
            className="text-tertiary-text h-3.5 w-3.5 shrink-0"
          />
          <p className="text-tertiary-text min-w-0 flex-1 truncate text-xs">
            Replying to{" "}
            <span className="text-secondary-text font-semibold">
              {replying?.sender ? getDisplayName(replying.sender) : "a message"}
            </span>
          </p>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="text-tertiary-text hover:bg-quaternary-bg hover:text-primary-text flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded"
          >
            <Icon icon="heroicons:x-mark" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div
        ref={composerRef}
        data-suggestions-anchor
        className={cn(
          "border-border-card bg-tertiary-bg text-primary-text focus-within:border-border-focus flex min-h-16 w-full items-center gap-2 rounded-xl border px-1 py-2 transition-[border-radius] duration-200 ease-out",
          replyingTo && "rounded-t-none",
        )}
      >
        <MessageComposer
          conversationId={conversationId}
          placeholder={placeholder}
          maxChars={MESSAGE_CHAR_LIMIT}
          isSending={isSending}
          disabled={disabled}
          actions={actions}
          onSend={onSend}
          onTyping={onTyping}
          mentionUsers={mentionCandidates}
        />
      </div>
    </div>
  );
}

interface ComposerFooterProps {
  messageBan: BanInfo | null;
  replyingToMessage: Message | null;
  setReplyingToMessage: Dispatch<SetStateAction<Message | null>>;
  currentUser: UserData | null;
  currentUserEnriched: MessageUser | null;
  currentUserMessageUser: MessageUser | null;
  selectedUser: MessageUser;
  selectedUserId: string | null;
  messagePlaceholder: string;
  isSending: boolean;
  isUnmessageable: boolean;
  isTyping: boolean;
  onSend: (
    message: string,
    metadata?: OutgoingMessageMetadata,
  ) => void | Promise<void>;
  onTyping: () => void;
  onSendGift: (gift: SupporterGift) => Promise<void>;
}

/** The DM composer: the shared bar, with gifts in its menu. */
export function ComposerFooter({
  messageBan,
  replyingToMessage,
  setReplyingToMessage,
  currentUser,
  currentUserEnriched,
  currentUserMessageUser,
  selectedUser,
  selectedUserId,
  messagePlaceholder,
  isSending,
  isUnmessageable,
  isTyping,
  onSend,
  onTyping,
  onSendGift,
}: ComposerFooterProps) {
  const blocked = !!messageBan || isUnmessageable;
  const mentionCandidates = useMemo(() => [selectedUser], [selectedUser]);
  return (
    <ComposerBar
      messageBan={messageBan}
      replying={
        replyingToMessage
          ? {
              message: replyingToMessage,
              sender:
                replyingToMessage.senderId === selectedUserId
                  ? selectedUser
                  : (currentUserEnriched ?? currentUserMessageUser),
            }
          : null
      }
      onCancelReply={() => setReplyingToMessage(null)}
      mentionCandidates={mentionCandidates}
      typingUsers={isTyping ? [selectedUser] : []}
      conversationId={selectedUserId}
      placeholder={messagePlaceholder}
      isSending={isSending}
      disabled={blocked}
      actions={
        currentUser && selectedUserId ? (
          <ComposerActionsMenu
            key={`${currentUser.id}:${selectedUserId}`}
            userId={asId(currentUser.id)}
            recipientLabel={getDisplayName(selectedUser)}
            disabled={isSending || blocked}
            onSend={onSend}
            onSendGift={onSendGift}
          />
        ) : null
      }
      onSend={onSend}
      onTyping={onTyping}
    />
  );
}
