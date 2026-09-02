"use client";

import type { Dispatch, SetStateAction } from "react";
import { BanBanner } from "@/components/ui/BanBanner";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/IconWrapper";
import { MessageComposer } from "@/components/Users/MessageComposer";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import {
  MESSAGE_CHAR_LIMIT,
  type Message,
  type MessageUser,
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
  onSend: (message: string) => void;
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
  onSend,
}: ComposerFooterProps) {
  return (
    <div className="bg-secondary-bg border-border-card sticky bottom-0 border-t p-3">
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
          "border-border-card bg-tertiary-bg text-primary-text focus-within:border-border-focus flex w-full items-center gap-2 rounded-md border px-1 py-1 shadow-none",
          replyingToMessage && "rounded-t-none border-t-0",
        )}
      >
        <MessageComposer
          conversationId={selectedUserId}
          placeholder={messagePlaceholder}
          maxChars={MESSAGE_CHAR_LIMIT}
          isSending={isSending}
          disabled={!!messageBan || isUnmessageable}
          onSend={onSend}
        />
      </div>
    </div>
  );
}
