"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import type { MessageUser } from "@/utils/messages/types";
import { PresenceDot } from "./ConversationSidebar";
import { getDisplayName } from "@/utils/messages/formatting";

interface ChatHeaderPanelProps {
  selectedUser: MessageUser;
  currentUserId: string | null;
  isTargetOnline: boolean;
  shouldHidePresence: boolean;
  lastSeenTime: string;
  selectedUserBlockedByMe: boolean;
  isProcessingBlockAction: boolean;
  goToConversationList: () => void;
  onToggleBlock: () => void;
}

export function ChatHeaderPanel({
  selectedUser,
  currentUserId,
  isTargetOnline,
  shouldHidePresence,
  selectedUserBlockedByMe,
  isProcessingBlockAction,
  goToConversationList,
  onToggleBlock,
}: ChatHeaderPanelProps) {
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const blockAction = selectedUserBlockedByMe ? "Unblock" : "Block";
  return (
    // Like the app's header: avatar with presence, name, block button.
    <ChatHeader className="border-border-primary gap-2.5 border-b px-3 py-2.5 lg:px-5">
      <ChatHeaderAddon className="lg:hidden">
        <button
          type="button"
          onClick={goToConversationList}
          aria-label="Back to conversations"
          className="text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
        </button>
      </ChatHeaderAddon>
      <ChatHeaderAddon>
        <Link
          href={`/users/${selectedUser.id}`}
          prefetch={false}
          className="relative cursor-pointer rounded-full"
          aria-label={`View ${getDisplayName(selectedUser)} profile`}
        >
          <UserAvatar
            userId={selectedUser.id}
            bgClassName="bg-quaternary-bg"
            avatarHash={selectedUser.avatar}
            username={selectedUser.username}
            custom_avatar={selectedUser.custom_avatar}
            size={8}
            showBadge={false}
            settings={selectedUser.settings_v2}
            premiumType={selectedUser.premiumtype}
          />
          {!shouldHidePresence && (
            <PresenceDot online={isTargetOnline} typing={false} />
          )}
        </Link>
      </ChatHeaderAddon>
      <ChatHeaderMain>
        <Link
          href={`/users/${selectedUser.id}`}
          prefetch={false}
          className="text-primary-text min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold hover:underline"
        >
          {getDisplayName(selectedUser)}
        </Link>
      </ChatHeaderMain>
      {currentUserId !== selectedUser.id && (
        <ChatHeaderAddon>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={
                  selectedUserBlockedByMe
                    ? "text-status-error! hover:bg-status-error/10! size-7! rounded-md!"
                    : "text-secondary-text! hover:bg-quaternary-bg! hover:text-primary-text! size-7! rounded-md!"
                }
                aria-label={`${blockAction} ${getDisplayName(selectedUser)}`}
                disabled={isProcessingBlockAction}
                onClick={() => setBlockConfirmOpen(true)}
              >
                {isProcessingBlockAction ? (
                  <Spinner className="size-4!" />
                ) : (
                  <Icon icon="heroicons:no-symbol" className="size-4!" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{blockAction} user</TooltipContent>
          </Tooltip>
        </ChatHeaderAddon>
      )}
      <ConfirmDialog
        isOpen={blockConfirmOpen}
        onClose={() => setBlockConfirmOpen(false)}
        onConfirm={onToggleBlock}
        title={`${blockAction} ${getDisplayName(selectedUser)}?`}
        confirmText={blockAction}
        confirmVariant={selectedUserBlockedByMe ? "default" : "destructive"}
        confirmDisabled={isProcessingBlockAction}
        message={
          selectedUserBlockedByMe
            ? "This removes your block on this user."
            : "You won’t be able to exchange messages with this user. They won’t be notified."
        }
      />
    </ChatHeader>
  );
}
