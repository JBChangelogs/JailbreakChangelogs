"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChatHeader,
  ChatHeaderAddon,
  ChatHeaderMain,
} from "@/components/chat/chat-header";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { MessageUser } from "@/utils/messages/types";
import { getDisplayName } from "@/utils/messages/formatting";

interface ChatHeaderPanelProps {
  selectedUser: MessageUser;
  currentUserId: string | null;
  showOfferAcceptedBanner: boolean;
  isTargetOnline: boolean;
  shouldHidePresence: boolean;
  lastSeenTime: string;
  selectedUserBlockedByMe: boolean;
  isProcessingBlockAction: boolean;
  goToConversationList: () => void;
  onViewProfile: () => void;
  onToggleBlock: () => void;
}

export function ChatHeaderPanel({
  selectedUser,
  currentUserId,
  showOfferAcceptedBanner,
  isTargetOnline,
  shouldHidePresence,
  lastSeenTime,
  selectedUserBlockedByMe,
  isProcessingBlockAction,
  goToConversationList,
  onViewProfile,
  onToggleBlock,
}: ChatHeaderPanelProps) {
  return (
    <ChatHeader
      className={cn(
        "border-border-card px-4 py-3",
        showOfferAcceptedBanner ? "" : "border-b",
      )}
    >
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
            avatarHash={selectedUser.avatar}
            username={selectedUser.username}
            custom_avatar={selectedUser.custom_avatar}
            size={8}
            isOnline={isTargetOnline}
            showBadge={true}
            onlineRingClassName="ring-2"
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
      <ChatHeaderAddon>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="!size-8 sm:!size-10"
              aria-label="Conversation actions"
            >
              <Icon
                icon="heroicons:ellipsis-horizontal"
                className="!size-4 sm:!size-5"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-0">
            <DropdownMenuItem
              onClick={onViewProfile}
              className="bg-tertiary-bg rounded-none px-3 py-2"
            >
              <Icon icon="heroicons:user-circle" className="h-4 w-4" />
              View Profile
            </DropdownMenuItem>
            {currentUserId !== selectedUser.id && (
              <DropdownMenuItem
                onClick={onToggleBlock}
                disabled={isProcessingBlockAction}
                className="bg-tertiary-bg text-button-danger hover:bg-button-danger/10 hover:text-button-danger focus:bg-button-danger/10 focus:text-button-danger rounded-none px-3 py-2"
              >
                <Icon
                  icon={
                    selectedUserBlockedByMe
                      ? "heroicons:lock-open"
                      : "heroicons:no-symbol"
                  }
                  className="h-4 w-4"
                />
                {selectedUserBlockedByMe ? "Unblock User" : "Block User"}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </ChatHeaderAddon>
    </ChatHeader>
  );
}
