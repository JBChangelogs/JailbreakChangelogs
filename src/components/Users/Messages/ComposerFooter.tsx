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
      <div className="bg-secondary-bg border-border-card shrink-0 border-t p-3">
        {messageBan && <BanBanner ban={messageBan} className="mb-3" />}
        {replyingToMessage && (
          <div className="bg-tertiary-bg border-border-card flex w-full items-center justify-between rounded-t-md border-x border-t px-3 py-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Icon
                icon="heroicons-outline:reply"
                className="text-secondary-text h-3 w-3 shrink-0"
              />
              <span className="text-secondary-text">
                Replying to{" "}
                <span className="text-primary-text font-bold">
                  {replyingToMessage.senderId === asId(currentUser?.id)
                    ? "yourself"
                    : getDisplayName(
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
              className="h-5 w-5 rounded-full p-0"
              onClick={() => setReplyingToMessage(null)}
            >
              <Icon icon="lucide:x" className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div
          className={cn(
            "border-border-card bg-tertiary-bg text-primary-text focus-within:border-link focus-within:ring-link/20 flex w-full items-center gap-2 rounded-xl border px-2 py-2 shadow-none transition-colors focus-within:ring-2 sm:px-3 sm:py-3",
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
