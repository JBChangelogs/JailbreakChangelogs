"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/IconWrapper";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import type { ConversationSummary, MessageUser } from "@/utils/messages/types";
import {
  fetchGroupIcon,
  fetchMessageUsers,
  type GroupChatSummary,
} from "@/utils/api/groupChats";
import { getDisplayName } from "@/utils/messages/formatting";
import { LeaveGroupDialog } from "@/components/Users/Messages/GroupChatDialogs";

// Styled like the desktop app's conversation list, with group chats mixed in
// by latest activity.

interface ConversationSidebarProps {
  userSearchQuery: string;
  setUserSearchQuery: Dispatch<SetStateAction<string>>;
  isUserSearchLoading: boolean;
  userSearchResults: UserData[];
  conversations: ConversationSummary[];
  groups: GroupChatSummary[];
  typingUserIds: Set<string>;
  /** Group id -> who is typing in it. */
  groupTypingUserIds: Map<string, Set<string>>;
  currentUserId: string | null;
  selectedUserId: string | null;
  selectedGroupId: string | null;
  isLoadingConversations: boolean;
  errorMessage?: string | null;
  isAuthenticated: boolean;
  recentlyHiddenConversations: ConversationSummary[];
  userSearchInputRef: RefObject<HTMLInputElement | null>;
  selectConversation: (userId: string) => void;
  selectGroup: (groupId: string) => void;
  onNewMessage: () => void;
  /** You left the group, or deleted it. */
  onGroupRemoved: (groupId: string) => void;
  hideConversation: (conversation: ConversationSummary) => void;
  unhideRecentlyHiddenConversation: (conversation: ConversationSummary) => void;
}

type ListEntry =
  | { kind: "dm"; id: string; at: number; conversation: ConversationSummary }
  | { kind: "group"; id: string; at: number; group: GroupChatSummary };

/** DMs and groups together, most recent activity first. */
export function mergeConversationList(
  conversations: ConversationSummary[],
  groups: GroupChatSummary[],
): ListEntry[] {
  return [
    ...conversations.map((conversation): ListEntry => ({
      kind: "dm",
      id: conversation.user.id,
      at: conversation.lastMessage?.createdAt ?? 0,
      conversation,
    })),
    ...groups.map((group): ListEntry => ({
      kind: "group",
      id: group.id,
      at: group.lastMessage?.createdAt ?? group.createdAt,
      group,
    })),
  ].sort((a, b) => b.at - a.at);
}

const ROW =
  "group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors";

export function ConversationListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading conversations"
      className="space-y-0.5 px-2 pt-10"
    >
      <span className="sr-only">Loading conversations</span>
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-2.5 px-2 py-1.5"
        >
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <Skeleton className={cn("h-3.5", index % 2 ? "w-24" : "w-32")} />
        </div>
      ))}
    </div>
  );
}

/** The app's presence dot; while typing it widens to hold three dots. */
export function PresenceDot({
  online,
  typing,
}: {
  online: boolean;
  typing: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "ring-secondary-bg absolute right-0 bottom-0 flex h-2.5 w-2.5 items-center justify-center gap-[2px] rounded-full ring-2 transition-[width]",
        typing && "w-6!",
        online || typing ? "bg-status-success-vibrant" : "bg-status-neutral",
      )}
    >
      {typing &&
        ["[animation-delay:-0.3s]", "[animation-delay:-0.15s]", ""].map(
          (delay) => (
            <span
              key={delay}
              className={cn(
                "animate-typing-dot h-1 w-1 rounded-full bg-white",
                delay,
              )}
            />
          ),
        )}
    </span>
  );
}

/** Changes whenever the member list does, to refetch the icon. */
function memberHash(memberIds: string[]): string {
  let hash = 5381;
  for (const char of [...memberIds].sort().join(","))
    hash = ((hash << 5) + hash + char.charCodeAt(0)) | 0;
  return (hash >>> 0).toString(36);
}

/**
 * A group's avatar: the API's generated icon of its most active members, as
 * overlapping circles. Until it loads, or if it can't, the first two letters
 * of its name in a circle, like the app's fallback.
 */
export function GroupAvatar({
  name,
  groupId,
  memberIds,
  className,
}: {
  name: string;
  groupId?: string;
  memberIds?: string[];
  className?: string;
}) {
  const version = memberHash(memberIds ?? []);
  const { data: icon } = useQuery({
    queryKey: ["group-icon", groupId, version],
    queryFn: ({ signal }) => fetchGroupIcon(groupId!, version, signal),
    enabled: !!groupId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  });
  // An object URL per avatar, released when it changes or unmounts.
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!icon) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(icon);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [icon]);
  // The icon is overlapping circles on a transparent background, so it gets
  // no backdrop, rounding or crop: the gaps show the list behind it.
  return src ? (
    <span
      aria-hidden="true"
      className={cn("relative block shrink-0", className)}
    >
      <Image
        src={src}
        alt=""
        fill
        sizes="64px"
        unoptimized
        draggable={false}
        className="object-contain"
      />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className={cn(
        "bg-tertiary-bg text-secondary-text flex shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        className,
      )}
    >
      {name.trim().slice(0, 2).toUpperCase() || "#"}
    </span>
  );
}

/** "Sam is typing…", "Sam and Kim are typing…", or "Several people are typing…". */
export function groupTypingLabel(users: MessageUser[]): string {
  if (users.length === 1) return `${getDisplayName(users[0])} is typing…`;
  if (users.length === 2)
    return `${getDisplayName(users[0])} and ${getDisplayName(users[1])} are typing…`;
  return "Several people are typing…";
}

function UnreadBadge({ count, active }: { count: number; active: boolean }) {
  if (count <= 0) return null;
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
      <span
        className={cn(
          "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
          active
            ? "bg-primary-text/20 text-primary-text"
            : "bg-card-tag-bg text-card-tag-text",
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </span>
  );
}

function UserSearch({
  query,
  setQuery,
  isLoading,
  results,
  inputRef,
  disabled,
  onSelect,
}: {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  isLoading: boolean;
  results: UserData[];
  inputRef: RefObject<HTMLInputElement | null>;
  disabled: boolean;
  onSelect: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative shrink-0 px-2 pt-2">
      <div className="relative">
        <Icon
          icon="heroicons:magnifying-glass"
          aria-hidden="true"
          className="text-secondary-text pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
          placeholder="Find a Conversation"
          aria-label="Find a conversation"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          className="border-border-card bg-secondary-bg text-primary-text placeholder-secondary-text focus:border-button-info h-10 w-full rounded-lg border py-2 pr-8 pl-9 text-sm transition-colors focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            aria-label="Clear search"
            className="text-secondary-text hover:text-primary-text absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer transition-colors"
          >
            <Icon icon="heroicons:x-mark" className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && query.trim() && (
        <div className="border-border-card bg-primary-bg text-primary-text absolute inset-x-2 top-full z-10 mt-1 max-h-72 overflow-y-auto rounded-lg border shadow-lg">
          {isLoading ? (
            <p className="text-quaternary-text px-3 py-3 text-center text-xs">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="text-quaternary-text px-3 py-3 text-center text-xs">
              No users found.
            </p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user.id);
                  setQuery("");
                  setOpen(false);
                }}
                className="hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors"
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
                <span className="text-primary-text min-w-0 flex-1 truncate text-sm font-medium">
                  {user.global_name && user.global_name !== "None"
                    ? user.global_name
                    : user.username}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function ConversationSidebar({
  userSearchQuery,
  setUserSearchQuery,
  isUserSearchLoading,
  userSearchResults,
  conversations,
  groups,
  typingUserIds,
  groupTypingUserIds,
  currentUserId,
  selectedUserId,
  selectedGroupId,
  isLoadingConversations,
  errorMessage,
  isAuthenticated,
  recentlyHiddenConversations,
  userSearchInputRef,
  selectConversation,
  selectGroup,
  onNewMessage,
  onGroupRemoved,
  hideConversation,
  unhideRecentlyHiddenConversation,
}: ConversationSidebarProps) {
  const entries = mergeConversationList(conversations, groups);
  const hasSelection = !!selectedUserId || !!selectedGroupId;
  const [leaving, setLeaving] = useState<GroupChatSummary | null>(null);
  // Names for "Sam is typing…" on group rows.
  const typerIds = [
    ...new Set([...groupTypingUserIds.values()].flatMap((ids) => [...ids])),
  ].sort();
  const { data: typers } = useQuery({
    queryKey: ["message-users-batch", typerIds],
    queryFn: () => fetchMessageUsers(typerIds),
    enabled: typerIds.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });

  return (
    <aside
      className={cn(
        "border-border-primary bg-secondary-bg flex h-full min-h-0 flex-col lg:border-r",
        hasSelection && "hidden lg:flex",
      )}
    >
      <UserSearch
        query={userSearchQuery}
        setQuery={setUserSearchQuery}
        isLoading={isUserSearchLoading}
        results={userSearchResults}
        inputRef={userSearchInputRef}
        disabled={!isAuthenticated}
        onSelect={selectConversation}
      />
      <div className="flex items-center justify-between py-1.5 pr-2 pl-3">
        <h1 className="text-quaternary-text text-xs font-bold tracking-wide uppercase">
          Messages
        </h1>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onNewMessage}
              disabled={!isAuthenticated}
              aria-label="New message"
              className="text-tertiary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors disabled:opacity-50"
            >
              <Icon icon="heroicons:plus" className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New message</TooltipContent>
        </Tooltip>
      </div>

      {recentlyHiddenConversations.map((conversation) => (
        <div
          key={conversation.user.id}
          className="bg-tertiary-bg text-secondary-text mx-2 mb-1.5 flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs"
        >
          <span className="min-w-0 truncate">
            Hid {getDisplayName(conversation.user)}
          </span>
          <button
            type="button"
            onClick={() => unhideRecentlyHiddenConversation(conversation)}
            className="text-link hover:text-link-hover shrink-0 cursor-pointer font-semibold"
          >
            Undo
          </button>
        </div>
      ))}

      <div className="min-h-0 flex-1 touch-pan-y space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-2">
        {isLoadingConversations && entries.length === 0 ? (
          <ConversationListSkeleton />
        ) : errorMessage && entries.length === 0 ? (
          <p
            role="alert"
            className="text-form-error px-2 py-6 text-center text-xs"
          >
            {errorMessage}
          </p>
        ) : entries.length === 0 ? (
          <p className="text-quaternary-text px-2 py-6 text-center text-xs">
            No conversations yet.
          </p>
        ) : (
          entries.map((entry) => {
            if (entry.kind === "group") {
              const { group } = entry;
              const active = selectedGroupId === group.id;
              const typing = [...(groupTypingUserIds.get(group.id) ?? [])]
                .filter((id) => id !== currentUserId)
                .map(
                  (id) =>
                    typers?.find((user) => user.id === id) ?? {
                      id,
                      username: "Someone",
                      avatar: "",
                    },
                );
              const select = () => selectGroup(group.id);
              return (
                <div
                  key={`group:${group.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={select}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select();
                    }
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    ROW,
                    active
                      ? "bg-button-secondary/45 text-primary-text"
                      : "hover:bg-quaternary-bg",
                  )}
                >
                  <GroupAvatar
                    name={group.name}
                    groupId={group.id}
                    memberIds={group.memberIds}
                    className="h-8 w-8"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-primary-text block truncate text-[15px] font-medium">
                      {group.name}
                    </span>
                    {typing.length > 0 ? (
                      <span className="text-tertiary-text block truncate text-[11px]">
                        {groupTypingLabel(typing)}
                      </span>
                    ) : (
                      <span className="text-quaternary-text block truncate text-[11px]">
                        {group.memberIds.length} members
                      </span>
                    )}
                  </span>
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                    <UnreadBadge
                      count={active ? 0 : group.unreadCount}
                      active={active}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLeaving(group);
                          }}
                          aria-label={`Leave ${group.name}`}
                          className={cn(
                            "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100",
                            !group.unreadCount &&
                              "[@media(hover:none)]:opacity-100",
                            active
                              ? "text-primary-text"
                              : "text-tertiary-text hover:text-primary-text",
                          )}
                        >
                          <Icon
                            icon="heroicons:x-mark"
                            className="h-4.5 w-4.5"
                          />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Leave group</TooltipContent>
                    </Tooltip>
                  </span>
                </div>
              );
            }

            const { conversation } = entry;
            const { user } = conversation;
            const active = selectedUserId === user.id;
            const label = getDisplayName(user);
            return (
              <div
                key={`dm:${user.id}`}
                role="button"
                tabIndex={0}
                onClick={() => selectConversation(user.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectConversation(user.id);
                  }
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  ROW,
                  active
                    ? "bg-button-secondary/45 text-primary-text"
                    : "hover:bg-quaternary-bg",
                )}
              >
                <span className="relative shrink-0">
                  <UserAvatar
                    userId={user.id}
                    bgClassName="bg-tertiary-bg"
                    avatarHash={user.avatar}
                    username={user.username}
                    custom_avatar={user.custom_avatar}
                    size={8}
                    showBadge={false}
                    settings={user.settings_v2}
                    premiumType={user.premiumtype}
                  />
                  <PresenceDot
                    online={user.presence?.status === "Online"}
                    typing={typingUserIds.has(user.id)}
                  />
                </span>
                <span className="text-primary-text min-w-0 flex-1 truncate text-[15px] font-medium">
                  {label}
                </span>
                <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                  <UnreadBadge
                    count={active ? 0 : (conversation.unreadCount ?? 0)}
                    active={active}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          hideConversation(conversation);
                        }}
                        aria-label={`Hide conversation with ${label}`}
                        className={cn(
                          "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100",
                          // Touch can't hover: show it, unless the badge is there.
                          !conversation.unreadCount &&
                            "[@media(hover:none)]:opacity-100",
                          active
                            ? "text-primary-text"
                            : "text-tertiary-text hover:text-primary-text",
                        )}
                      >
                        <Icon icon="heroicons:x-mark" className="h-4.5 w-4.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Hide conversation
                    </TooltipContent>
                  </Tooltip>
                </span>
              </div>
            );
          })
        )}
      </div>
      {leaving && (
        <LeaveGroupDialog
          open
          onOpenChange={(open) => !open && setLeaving(null)}
          group={leaving}
          currentUserId={currentUserId}
          onRemoved={onGroupRemoved}
        />
      )}
    </aside>
  );
}
