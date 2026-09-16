"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import Twemoji from "react-twemoji";
import { ConversationRowTime } from "@/components/Users/Messages/ConversationRowTime";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import { Skeleton } from "@/components/ui/skeleton";
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
  typingUserIds: Set<string>;
  selectedUserId: string | null;
  currentUserId: string | null;
  isLoadingConversations: boolean;
  isAuthenticated: boolean;
  twemojiEnabled: boolean;
  userSearchInputRef: RefObject<HTMLInputElement | null>;
  selectConversation: (userId: string) => void;
  hideConversation: (conversation: ConversationSummary) => void;
}

function ConversationListSkeleton() {
  return (
    <div role="status" aria-label="Loading conversations">
      <span className="sr-only">Loading conversations</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="border-border-card flex items-start gap-3 border-b border-l-2 border-l-transparent px-4 py-3"
        >
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className={cn("h-4", index % 2 ? "w-28" : "w-36")} />
            <Skeleton
              className={cn("mt-1.5 h-3", index % 3 === 0 ? "w-4/5" : "w-3/5")}
            />
          </div>
          <Skeleton className="mt-0.5 h-3 w-8 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function ConversationSidebar({
  userSearchQuery,
  setUserSearchQuery,
  isUserSearchLoading,
  userSearchResults,
  totalConversations,
  conversations,
  typingUserIds,
  selectedUserId,
  currentUserId,
  isLoadingConversations,
  isAuthenticated,
  twemojiEnabled,
  userSearchInputRef,
  selectConversation,
  hideConversation,
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
          <ConversationListSkeleton />
        ) : conversations.length === 0 ? (
          <p className="text-secondary-text px-4 py-4 text-sm">
            No conversations yet.
          </p>
        ) : (
          conversations.map((conversation) => {
            const isActive = selectedUserId === conversation.user.id;
            const unreadCount = isActive ? 0 : (conversation.unreadCount ?? 0);
            const isUnread = unreadCount > 0;
            const isTyping = typingUserIds.has(conversation.user.id);
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
              <div
                key={conversation.user.id}
                className={cn(
                  "border-border-card hover:bg-tertiary-bg group flex items-start gap-3 border-b border-l-2 border-l-transparent px-4 py-3 transition-colors",
                  isActive ? "bg-tertiary-bg border-l-button-info" : "",
                  isUnread && !isActive ? "border-l-primary-text" : "",
                  isSystemPreview && !isActive ? "bg-tertiary-bg/40" : "",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectConversation(conversation.user.id)}
                  aria-current={isActive ? "page" : undefined}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
                >
                  <UserAvatar
                    userId={conversation.user.id}
                    avatarHash={conversation.user.avatar}
                    username={conversation.user.username}
                    custom_avatar={conversation.user.custom_avatar}
                    size={9}
                    isOnline={conversation.user.presence?.status === "Online"}
                    showBadge={true}
                    presenceBadgeClassName={
                      isActive
                        ? "border-tertiary-bg"
                        : "group-hover:border-tertiary-bg"
                    }
                    settings={conversation.user.settings_v2}
                    premiumType={conversation.user.premiumtype}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm",
                        isUnread
                          ? "text-primary-text font-semibold"
                          : "text-secondary-text font-medium",
                        isActive ? "text-link" : "",
                      )}
                    >
                      {getDisplayName(conversation.user)}
                    </p>
                    {isTyping ? (
                      <div className="text-link mt-0.5 flex items-center gap-1 text-xs font-medium">
                        <Icon
                          icon="svg-spinners:3-dots-bounce"
                          className="h-3.5 w-3.5 shrink-0"
                        />
                        <span>typing…</span>
                      </div>
                    ) : (
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs",
                          isUnread
                            ? "text-primary-text font-medium"
                            : "text-secondary-text",
                        )}
                      >
                        {twemojiEnabled ? (
                          <Twemoji
                            tag="span"
                            options={{ className: "twemoji" }}
                          >
                            {formatMessageText(previewText)}
                          </Twemoji>
                        ) : (
                          formatMessageText(previewText)
                        )}
                      </p>
                    )}
                  </div>
                </button>
                <div className="relative -mt-1 -mr-1 flex h-5 shrink-0 items-center md:mt-0 md:mr-0">
                  <div className="transition-opacity md:group-focus-within:opacity-0 md:group-hover:opacity-0">
                    <ConversationRowTime
                      timestamp={conversation.lastMessage?.createdAt}
                      cacheKey={`conversation-row-${conversation.user.id}-${conversation.lastMessage?.id ?? "none"}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => hideConversation(conversation)}
                    className="text-secondary-text hover:bg-tertiary-bg hover:text-primary-text ml-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded opacity-70 transition-all hover:opacity-100 focus:opacity-100 md:absolute md:top-1/2 md:right-0 md:ml-0 md:h-6 md:w-6 md:-translate-y-1/2 md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
                    aria-label={`Hide conversation with ${getDisplayName(conversation.user)}`}
                    title="Hide conversation"
                  >
                    <Icon
                      icon="heroicons:x-mark"
                      className="h-3.5 w-3.5 shrink-0"
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
