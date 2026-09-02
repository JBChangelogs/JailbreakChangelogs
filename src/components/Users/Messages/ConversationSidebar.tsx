"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import Twemoji from "react-twemoji";
import { ConversationRowTime } from "@/components/Users/Messages/ConversationRowTime";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import type { ConversationSummary } from "@/utils/messages/types";
import {
  formatCountCapped,
  formatMessageText,
  formatSystemMessageContent,
  getDisplayName,
} from "@/utils/messages/formatting";

interface ConversationSidebarProps {
  userSearchQuery: string;
  setUserSearchQuery: Dispatch<SetStateAction<string>>;
  isUserSearchLoading: boolean;
  userSearchResults: UserData[];
  totalConversations: number | null;
  conversations: ConversationSummary[];
  selectedUserId: string | null;
  currentUserId: string | null;
  isLoadingConversations: boolean;
  isAuthenticated: boolean;
  twemojiEnabled: boolean;
  userSearchInputRef: RefObject<HTMLInputElement | null>;
  selectConversation: (userId: string) => void;
}

export function ConversationSidebar({
  userSearchQuery,
  setUserSearchQuery,
  isUserSearchLoading,
  userSearchResults,
  totalConversations,
  conversations,
  selectedUserId,
  currentUserId,
  isLoadingConversations,
  isAuthenticated,
  twemojiEnabled,
  userSearchInputRef,
  selectConversation,
}: ConversationSidebarProps) {
  return (
    <aside
      className={cn(
        "border-border-card flex h-full min-h-0 flex-col border-b lg:border-r lg:border-b-0",
        selectedUserId ? "hidden lg:flex" : "",
      )}
    >
      <div className="border-border-card border-b px-4 py-3">
        <p className="text-primary-text text-sm font-semibold">
          {userSearchQuery.trim()
            ? `${
                isUserSearchLoading
                  ? ""
                  : `${formatCountCapped(userSearchResults.length)} `
              }Search Results`
            : `${formatCountCapped(
                totalConversations ?? conversations.length,
              )} Conversations`}
        </p>
      </div>
      <div className="border-border-card border-b px-4 py-3">
        <div className="relative">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          />
          <input
            value={userSearchQuery}
            onChange={(event) => setUserSearchQuery(event.target.value)}
            placeholder="Search users to message..."
            className="border-border-card bg-tertiary-bg text-primary-text placeholder-secondary-text focus:border-button-info w-full rounded-md border py-2 pr-9 pl-9 text-sm transition-colors outline-none"
            autoComplete="off"
            spellCheck={false}
            disabled={!isAuthenticated}
            ref={userSearchInputRef}
          />
          {userSearchQuery.trim() ? (
            <button
              type="button"
              onClick={() => setUserSearchQuery("")}
              className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer transition-colors"
              aria-label="Clear search"
            >
              <Icon icon="heroicons:x-mark" className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain">
        {userSearchQuery.trim() ? (
          isUserSearchLoading ? (
            <div className="flex items-center justify-center px-4 py-10">
              <Spinner className="h-5 w-5" />
            </div>
          ) : userSearchResults.length === 0 ? (
            <p className="text-secondary-text px-4 py-4 text-sm">
              No users found.
            </p>
          ) : (
            userSearchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  setUserSearchQuery("");
                  selectConversation(user.id);
                }}
                className="border-border-card hover:bg-tertiary-bg group flex w-full cursor-pointer items-center gap-3 border-b px-4 py-3 text-left transition-colors"
              >
                <UserAvatar
                  userId={user.id}
                  avatarHash={user.avatar}
                  username={user.username}
                  custom_avatar={user.custom_avatar}
                  size={8}
                  showBadge={false}
                  settings={user.settings_v2}
                  premiumType={user.premiumtype}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-primary-text group-hover:text-link truncate text-sm font-medium transition-colors">
                    {user.global_name && user.global_name !== "None"
                      ? user.global_name
                      : user.username}
                  </p>
                  <p className="text-secondary-text truncate text-[11px]">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )
        ) : isLoadingConversations ? (
          <p className="text-secondary-text px-4 py-4 text-sm">
            Loading conversations...
          </p>
        ) : conversations.length === 0 ? (
          <p className="text-secondary-text px-4 py-4 text-sm">
            No conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => {
            const isActive = selectedUserId === conversation.user.id;
            const isSystemPreview = conversation.lastMessage?.type === "system";
            const isOwnPreview =
              !!currentUserId &&
              !!conversation.lastMessage &&
              conversation.lastMessage.type !== "system" &&
              conversation.lastMessage.senderId === currentUserId;
            const previewText = conversation.lastMessage
              ? conversation.lastMessage.type === "system"
                ? formatSystemMessageContent(
                    conversation.lastMessage,
                    currentUserId,
                    conversation.user,
                  )
                : isOwnPreview
                  ? `You: ${conversation.lastMessage.content}`
                  : conversation.lastMessage.content
              : "No messages yet";
            return (
              <button
                key={conversation.user.id}
                onClick={() => selectConversation(conversation.user.id)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "border-border-card hover:bg-tertiary-bg flex w-full cursor-pointer items-center gap-3 border-b border-l-2 border-l-transparent px-4 py-3 text-left transition-colors",
                  isActive ? "bg-tertiary-bg border-l-button-info" : "",
                  isSystemPreview && !isActive ? "bg-tertiary-bg/40" : "",
                )}
              >
                <UserAvatar
                  userId={conversation.user.id}
                  avatarHash={conversation.user.avatar}
                  username={conversation.user.username}
                  custom_avatar={conversation.user.custom_avatar}
                  size={9}
                  showBadge={false}
                  settings={conversation.user.settings_v2}
                  premiumType={conversation.user.premiumtype}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-primary-text min-w-0 truncate text-sm font-medium",
                        isActive ? "text-link" : "",
                      )}
                    >
                      {getDisplayName(conversation.user)}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <ConversationRowTime
                        timestamp={conversation.lastMessage?.createdAt}
                        cacheKey={`conversation-row-${conversation.user.id}-${conversation.lastMessage?.id ?? "none"}`}
                      />
                    </div>
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                    <p className="text-secondary-text min-w-0 truncate text-xs">
                      {twemojiEnabled ? (
                        <Twemoji tag="span" options={{ className: "twemoji" }}>
                          {formatMessageText(previewText)}
                        </Twemoji>
                      ) : (
                        formatMessageText(previewText)
                      )}
                    </p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
