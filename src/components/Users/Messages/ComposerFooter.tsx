"use client";

import type { Dispatch, SetStateAction } from "react";
import { BanBanner } from "@/components/ui/BanBanner";
import { Button } from "@/components/ui/button";
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
  return (
    <>
      {isTyping ? (
        <div
          className="bg-secondary-bg text-secondary-text flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs sm:px-4"
          aria-live="polite"
        >
          <Icon
            icon="svg-spinners:3-dots-bounce"
            className="h-4 w-4 shrink-0"
          />
          <UserAvatar
            userId={selectedUser.id}
            avatarHash={selectedUser.avatar}
            username={selectedUser.username}
            custom_avatar={selectedUser.custom_avatar}
            size={5}
            showBadge={false}
            settings={selectedUser.settings_v2}
            premiumType={selectedUser.premiumtype}
          />
          <span>
            <span className="text-primary-text font-medium">
              {getDisplayName(selectedUser)}
            </span>{" "}
            is typing…
          </span>
        </div>
      ) : null}
      <div className="shrink-0 px-3 pt-1 pb-3">
        {messageBan && <BanBanner ban={messageBan} className="mb-3" />}
        {replyingToMessage && (
          <div className="bg-secondary-bg border-border-card flex min-h-11 w-full items-center justify-between rounded-t-xl border px-3 text-sm lg:min-h-8 lg:text-xs">
            <div className="flex min-w-0 items-center gap-2">
              <span className="text-secondary-text truncate">
                Replying to{" "}
                <span className="text-primary-text font-bold">
                  {getDisplayName(
                    replyingToMessage.senderId === selectedUserId
                      ? selectedUser
                      : (currentUserEnriched ??
                          currentUserMessageUser ??
                          selectedUser),
                  )}
                </span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="!size-11 rounded-full p-0 lg:!size-8"
              aria-label="Cancel reply"
              onClick={() => setReplyingToMessage(null)}
            >
              <Icon icon="lucide:x" className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div
          className={cn(
            "border-border-card bg-tertiary-bg text-primary-text focus-within:border-link focus-within:ring-link/20 flex w-full items-center rounded-xl border px-2 py-1 shadow-none transition-colors focus-within:ring-2 sm:px-3 lg:py-2",
            replyingToMessage && "rounded-t-none border-t-0",
          )}
        >
          <MessageComposer
            conversationId={selectedUserId}
            placeholder={messagePlaceholder}
            maxChars={MESSAGE_CHAR_LIMIT}
            isSending={isSending}
            disabled={!!messageBan || isUnmessageable}
            actions={
              currentUser && selectedUserId ? (
                <ComposerActionsMenu
                  key={`${currentUser.id}:${selectedUserId}`}
                  userId={asId(currentUser.id)}
                  recipientLabel={getDisplayName(selectedUser)}
                  disabled={isSending || !!messageBan || isUnmessageable}
                  onSend={onSend}
                  onSendGift={onSendGift}
                />
              ) : null
            }
            onSend={onSend}
            onTyping={onTyping}
          />
        </div>
      </div>
    </>
  );
}
