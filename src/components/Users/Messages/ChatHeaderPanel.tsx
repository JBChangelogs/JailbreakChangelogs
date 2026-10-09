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
  lastSeenTime,
  selectedUserBlockedByMe,
  isProcessingBlockAction,
  goToConversationList,
  onToggleBlock,
}: ChatHeaderPanelProps) {
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false);
  const blockAction = selectedUserBlockedByMe ? "Unblock" : "Block";
  return (
    <ChatHeader className="border-border-card border-b px-4 py-3">
      <ChatHeaderAddon>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={goToConversationList}
          aria-label="Open conversations"
        >
          <svg
            className="text-primary-text h-5 w-5 fill-current"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            aria-hidden="true"
          >
            <path d="M64,384H448V341.33H64Zm0-106.67H448V234.67H64ZM64,128v42.67H448V128Z" />
          </svg>
        </Button>
      </ChatHeaderAddon>
      <ChatHeaderAddon>
        <Link
          href={`/users/${selectedUser.id}`}
          prefetch={false}
          className="cursor-pointer"
          aria-label={`View ${getDisplayName(selectedUser)} profile`}
        >
          <UserAvatar
            userId={selectedUser.id}
            bgClassName="bg-quaternary-bg"
            avatarHash={selectedUser.avatar}
            username={selectedUser.username}
            custom_avatar={selectedUser.custom_avatar}
            size={8}
            isOnline={isTargetOnline}
            showBadge={true}
            settings={selectedUser.settings_v2}
            premiumType={selectedUser.premiumtype}
          />
        </Link>
      </ChatHeaderAddon>
      <ChatHeaderMain>
        <div className="flex min-w-0 flex-col">
          <Link
            href={`/users/${selectedUser.id}`}
            prefetch={false}
            className="text-primary-text hover:text-link cursor-pointer truncate text-left text-base font-semibold transition-colors sm:text-lg"
          >
            {getDisplayName(selectedUser)}
          </Link>
          {shouldHidePresence ? (
            <p className="text-secondary-text truncate text-xs">
              Last seen: Hidden
            </p>
          ) : isTargetOnline ? (
            <p
              className="truncate text-xs"
              style={{
                color: "var(--color-status-success-vibrant)",
              }}
            >
              Online
            </p>
          ) : selectedUser.last_seen ? (
            <p className="text-secondary-text truncate text-xs">
              Last seen:{" "}
              {lastSeenTime ? (
                lastSeenTime
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Spinner className="h-3 w-3" />
                  Loading...
                </span>
              )}
            </p>
          ) : (
            <p className="text-secondary-text truncate text-xs">
              Last seen unavailable
            </p>
          )}
        </div>
      </ChatHeaderMain>
      {currentUserId !== selectedUser.id && (
        <ChatHeaderAddon>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-quaternary-bg! active:bg-quaternary-bg! !size-11 bg-transparent lg:!size-10"
                aria-label={`${blockAction} ${getDisplayName(selectedUser)}`}
                disabled={isProcessingBlockAction}
                onClick={() => setBlockConfirmOpen(true)}
              >
                {isProcessingBlockAction ? (
                  <Spinner className="!size-5" />
                ) : (
                  <Icon
                    icon={
                      selectedUserBlockedByMe
                        ? "heroicons:lock-open"
                        : "heroicons:no-symbol"
                    }
                    className="!size-5"
                  />
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
