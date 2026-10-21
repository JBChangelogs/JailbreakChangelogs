"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/ui/IconWrapper";
import { Spinner } from "@/components/ui/Spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chat } from "@/components/chat/chat";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MessageRow } from "@/components/Users/Messages/MessageRow";
import { ComposerBar } from "@/components/Users/Messages/ComposerFooter";
import { ComposerActionsMenu } from "@/components/Users/Messages/ComposerActionsMenu";
import {
  GroupAvatar,
  PresenceDot,
} from "@/components/Users/Messages/ConversationSidebar";
import {
  groupEventUserIds,
  parseGroupEvent,
} from "@/utils/messages/groupEvents";
import {
  AppDialog,
  RenameGroupDialog,
  UserPickerDialog,
  groupErrorMessage,
} from "@/components/Users/Messages/GroupChatDialogs";
import { useEmojiStringMap } from "@/hooks/useEmojiStringMap";
import { useOfferDetailsBatch } from "@/hooks/useOfferDetailsBatch";
import { useTwemoji } from "@/contexts/TwemojiContext";
import type { RealtimeGroupEventDetail } from "@/hooks/useGroupChats";
import { UserAvatar } from "@/utils/ui/avatar";
import { cn } from "@/lib/utils";
import type { UserData } from "@/types/auth";
import { showBanToast, type BanInfo } from "@/utils/api/ban";
import { asId } from "@/utils/messages/parsing";
import { getDisplayName } from "@/utils/messages/formatting";
import type {
  Message,
  MessageUser,
  OutgoingMessageMetadata,
  RealtimeMessageEventDetail,
} from "@/utils/messages/types";
import {
  addGroupMembers,
  deleteGroupMessage,
  editGroupMessage,
  fetchGroupChat,
  fetchGroupMessages,
  fetchMessageUsers,
  GROUP_MEMBER_LIMIT,
  GroupChatError,
  parseGroup,
  parseGroupMessage,
  removeGroupMember,
  reportGroupMessage,
  sendGroupMessage,
  type GroupChat,
  type GroupMessagesPage,
} from "@/utils/api/groupChats";

const NO_OFFERS: never[] = [];
const NO_TYPERS = new Set<string>();
const TYPING_THROTTLE_MS = 3000;
/**
 * Below this width for the chat and member list together, the list hides on
 * its own and opens over the chat instead, like Discord.
 */
const MEMBERS_SIDEBAR_MIN_ROW_WIDTH = 900;

interface GroupChatViewProps {
  groupId: string;
  /** From the conversation list, so the header shows at once. */
  summary?: GroupChat;
  currentUser: UserData | null;
  currentUserMessageUser: MessageUser | null;
  messageBan: BanInfo | null;
  setBan: (ban: BanInfo) => void;
  /** Members typing right now. */
  typingUserIds?: Set<string>;
  /** Offered in the Invite to Group modal: the people you DM. */
  suggestedUsers: MessageUser[];
  prepareMessageContentForApi: (text: string) => string;
  onBack: () => void;
  /** The group's messages have been read; clears its unread count. */
  onRead: () => void;
  onGroupChange: (group: GroupChat) => void;
  /** You left, or the group was deleted. */
  onLeft: () => void;
}

/** Online unless they're offline or hide their presence. */
const isOnline = (user: MessageUser) =>
  user.presence?.status === "Online" &&
  user.settings_v2?.hide_presence !== true;

/**
 * The group's members beside the chat, like the app's: in join order, with
 * presence, offline members dimmed, a crown on the owner, and (for the
 * owner) remove on hover and Invite to Group at the bottom.
 */
function GroupMembersPanel({
  group,
  members,
  currentUserId,
  typingUserIds,
  onUpdated,
  onInvite,
}: {
  group: GroupChat;
  members: MessageUser[];
  currentUserId: string | null;
  typingUserIds: Set<string>;
  onUpdated: (group: GroupChat) => void;
  /** Opens the Invite to Group modal; null when you can't invite. */
  onInvite: (() => void) | null;
}) {
  const isOwner = currentUserId !== null && group.ownerId === currentUserId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const removeMember = async (userId: string) => {
    setBusy(true);
    setError(null);
    try {
      await removeGroupMember(group.id, userId);
      onUpdated({
        ...group,
        memberIds: group.memberIds.filter((id) => id !== userId),
      });
    } catch (err) {
      setError(groupErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      aria-label="Members"
      className="border-border-primary bg-secondary-bg flex w-60 shrink-0 flex-col border-l"
    >
      <p className="text-quaternary-text px-4 pt-4 pb-2 text-xs font-bold tracking-wide uppercase">
        Members — {group.memberIds.length}
      </p>
      {error && (
        <p role="alert" className="text-form-error px-4 pb-2 text-xs">
          {error}
        </p>
      )}
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
        {members.map((user) => {
          const typing = typingUserIds.has(user.id);
          return (
            <li
              key={user.id}
              className="group hover:bg-quaternary-bg flex items-center gap-2.5 rounded-xl px-2 py-1.5"
            >
              <Link
                href={`/users/${user.id}`}
                prefetch={false}
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2.5",
                  // Offline members are dimmed, like Discord; hovering
                  // brings them back.
                  !isOnline(user) &&
                    !typing &&
                    "opacity-35 transition-opacity group-hover:opacity-100",
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
                  <PresenceDot online={isOnline(user)} typing={typing} />
                </span>
                <span className="text-primary-text min-w-0 truncate text-sm font-medium">
                  {getDisplayName(user)}
                </span>
                {user.id === group.ownerId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-status-warning shrink-0">
                        <Icon
                          icon="material-symbols:crown-rounded"
                          aria-label="Group owner"
                          className="h-3.5 w-3.5"
                        />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Group owner</TooltipContent>
                  </Tooltip>
                )}
              </Link>
              {isOwner && user.id !== currentUserId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => void removeMember(user.id)}
                      disabled={busy}
                      aria-label={`Remove ${getDisplayName(user)}`}
                      className="text-tertiary-text hover:text-primary-text flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md opacity-0 transition-all group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                    >
                      <Icon icon="heroicons:x-mark" className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Remove from group
                  </TooltipContent>
                </Tooltip>
              )}
            </li>
          );
        })}
      </ul>
      {onInvite && (
        // Same size and spot as the message composer beside it.
        <div className="shrink-0 px-2 pb-2">
          <button
            type="button"
            onClick={onInvite}
            className="border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg flex h-16 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors"
          >
            <Icon icon="heroicons:user-plus" className="h-4.5 w-4.5" />
            Invite to Group
          </button>
        </div>
      )}
    </aside>
  );
}

/** A group chat: the same rows and composer as DMs, with group controls. */
export function GroupChatView({
  groupId,
  summary,
  currentUser,
  currentUserMessageUser,
  messageBan,
  setBan,
  typingUserIds,
  suggestedUsers,
  prepareMessageContentForApi,
  onBack,
  onRead,
  onGroupChange,
  onLeft,
}: GroupChatViewProps) {
  const queryClient = useQueryClient();
  const currentUserId = currentUser ? asId(currentUser.id) : null;
  const emojiStringMap = useEmojiStringMap();
  const { twemojiEnabled } = useTwemoji();
  const offerDetails = useOfferDetailsBatch(NO_OFFERS);

  const groupKey = useMemo(() => ["group-chat", groupId], [groupId]);
  const groupQuery = useQuery({
    queryKey: groupKey,
    queryFn: () => fetchGroupChat(groupId),
    initialData: summary,
    staleTime: 30_000,
    retry: false,
  });
  const group = groupQuery.data;
  const setGroup = useCallback(
    (next: GroupChat) => {
      queryClient.setQueryData(groupKey, next);
      onGroupChange(next);
    },
    [queryClient, groupKey, onGroupChange],
  );
  const isOwner = !!group && group.ownerId === currentUserId;

  // The member list sits beside the chat when there's room. Narrower, it
  // hides on its own and the members button opens it over the chat instead.
  const [membersPinned, setMembersPinned] = useState(true);
  const [membersOverlayOpen, setMembersOverlayOpen] = useState(false);
  const [chatRow, setChatRow] = useState<HTMLDivElement | null>(null);
  const [chatRowWidth, setChatRowWidth] = useState(0);
  useLayoutEffect(() => {
    if (!chatRow) return;
    setChatRowWidth(chatRow.clientWidth);
    const observer = new ResizeObserver(([entry]) =>
      setChatRowWidth(entry.contentRect.width),
    );
    observer.observe(chatRow);
    return () => observer.disconnect();
  }, [chatRow]);
  const membersNarrow =
    chatRowWidth > 0 && chatRowWidth < MEMBERS_SIDEBAR_MIN_ROW_WIDTH;
  const showMembers = membersNarrow ? membersOverlayOpen : membersPinned;
  const toggleMembers = () =>
    membersNarrow
      ? setMembersOverlayOpen((open) => !open)
      : setMembersPinned((pinned) => !pinned);
  useEffect(() => setMembersOverlayOpen(false), [membersNarrow]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Messages, newest page first; shown oldest to newest.
  const messagesKey = useMemo(() => ["group-messages", groupId], [groupId]);
  const messagesQuery = useInfiniteQuery<GroupMessagesPage>({
    queryKey: messagesKey,
    queryFn: ({ pageParam }) => fetchGroupMessages(groupId, Number(pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
  const messages = useMemo(() => {
    const byId = new Map<string, Message>();
    for (const page of messagesQuery.data?.pages ?? [])
      for (const message of page.messages)
        if (!byId.has(message.id)) byId.set(message.id, message);
    return [...byId.values()].sort(
      (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
  }, [messagesQuery.data]);

  // Profiles for the members, and for anyone an event names (someone
  // removed, for example, is no longer a member).
  const memberIds = useMemo(() => {
    const ids = new Set(group?.memberIds ?? []);
    for (const message of messages) {
      const event = parseGroupEvent(message.metadata);
      if (event) for (const id of groupEventUserIds(event)) ids.add(id);
    }
    return [...ids].sort();
  }, [group?.memberIds, messages]);
  const membersQuery = useQuery({
    queryKey: ["message-users-batch", memberIds],
    queryFn: () => fetchMessageUsers(memberIds),
    enabled: memberIds.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const usersById = useMemo(() => {
    const map = new Map<string, MessageUser>();
    for (const user of Array.isArray(membersQuery.data)
      ? membersQuery.data
      : [])
      map.set(user.id, user);
    if (currentUserMessageUser)
      map.set(currentUserMessageUser.id, currentUserMessageUser);
    return map;
  }, [membersQuery.data, currentUserMessageUser]);

  // Keep members' presence live, like the DM list does.
  useEffect(() => {
    const onPresence = (event: Event) => {
      const { action, data } = (
        event as CustomEvent<RealtimeMessageEventDetail>
      ).detail;
      if (action !== "presence_update" || !data?.user_id || !data.status)
        return;
      const { user_id: userId, status } = data;
      queryClient.setQueryData<MessageUser[]>(
        ["message-users-batch", memberIds],
        (users) =>
          users?.map((user) =>
            user.id === userId
              ? { ...user, presence: { status, last_updated: Date.now() } }
              : user,
          ),
      );
    };
    window.addEventListener("realtimeMessage", onPresence);
    return () => window.removeEventListener("realtimeMessage", onPresence);
  }, [queryClient, memberIds]);

  const setMessages = useCallback(
    (update: (messages: Message[]) => Message[]) =>
      queryClient.setQueryData<InfiniteData<GroupMessagesPage>>(
        messagesKey,
        (previous) => {
          if (!previous) return previous;
          const all = previous.pages.flatMap((page) => page.messages);
          const next = update(all);
          // Keep it in one page: order is by createdAt anyway.
          return {
            ...previous,
            pages: previous.pages.map((page, index) => ({
              ...page,
              messages: index === 0 ? next : [],
            })),
          };
        },
      ),
    [queryClient, messagesKey],
  );

  // Loading the first page marks the group read on the server.
  const firstLoaded = messagesQuery.isSuccess;
  useEffect(() => {
    if (firstLoaded) onRead();
    // Once per group; onRead is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstLoaded, groupId]);

  // Scroll: start at the bottom, follow new messages while at the bottom,
  // and keep your place when older messages load above.
  const containerRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const prependRef = useRef<number | null>(null);
  const lastIdRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (prependRef.current !== null) {
      container.scrollTop += container.scrollHeight - prependRef.current;
      prependRef.current = null;
      return;
    }
    const lastId = messages.at(-1)?.id ?? null;
    if (lastId !== lastIdRef.current && atBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
    lastIdRef.current = lastId;
  }, [messages]);
  const loadOlder = () => {
    const container = containerRef.current;
    if (container) prependRef.current = container.scrollHeight;
    void messagesQuery.fetchNextPage();
  };

  // Live updates for this group.
  useEffect(() => {
    const onEvent = (event: Event) => {
      const { action, data } = (event as CustomEvent<RealtimeGroupEventDetail>)
        .detail;
      if (action === "group_deleted" && String(data.id) === groupId) {
        toast("This group was deleted, or you were removed from it.");
        onLeft();
        return;
      }
      if (action === "group_updated") {
        const next = parseGroup(data);
        if (next?.id === groupId) queryClient.setQueryData(groupKey, next);
        return;
      }
      if (String(data.group_id) !== groupId) return;
      if (
        action === "group_message_received" ||
        action === "group_message_sent"
      ) {
        const message = parseGroupMessage(data);
        if (!message) return;
        setMessages((list) =>
          list.some((item) => item.id === message.id)
            ? list
            : [...list, message],
        );
        if (action === "group_message_received") {
          // Read while it's open; otherwise it would stay unread.
          window.dispatchEvent(
            new CustomEvent("sendRealtimeGroupMarkRead", {
              detail: { group_id: groupId },
            }),
          );
          onRead();
        }
        return;
      }
      if (action === "group_message_edited") {
        const message = parseGroupMessage(data);
        if (!message) return;
        setMessages((list) =>
          list.map((item) =>
            item.id === message.id
              ? {
                  ...item,
                  content: message.content,
                  updatedAt: message.updatedAt,
                }
              : item,
          ),
        );
        return;
      }
      if (action === "group_message_deleted") {
        const id = String(data.id);
        setMessages((list) => list.filter((item) => item.id !== id));
      }
    };
    window.addEventListener("realtimeGroup", onEvent);
    return () => window.removeEventListener("realtimeGroup", onEvent);
  }, [groupId, groupKey, onLeft, onRead, queryClient, setMessages]);

  const [isSending, setIsSending] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(
    null,
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(
    null,
  );
  const [reportingMessage, setReportingMessage] = useState<Message | null>(
    null,
  );
  const [reportReason, setReportReason] = useState("");

  const handleError = (error: unknown, fallback: string) => {
    if (error instanceof GroupChatError && error.ban) {
      setBan(error.ban);
      showBanToast(error.ban);
      return;
    }
    toast.error(error instanceof Error ? error.message : fallback);
  };

  const send = async (
    text: string,
    metadata?: OutgoingMessageMetadata,
    // Invites never go out as replies, like DMs.
    parentId = metadata ? null : (replyingToMessage?.id ?? null),
  ) => {
    const content = prepareMessageContentForApi(text);
    if (!content || !currentUserId) return;
    const clientId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const pending: Message = {
      id: clientId,
      clientId,
      parentId,
      senderId: currentUserId,
      receiverId: groupId,
      content,
      metadata: metadata ?? null,
      createdAt: Date.now(),
      type: metadata ? "system" : "user",
      status: "pending",
    };
    atBottomRef.current = true;
    if (!metadata) setReplyingToMessage(null);
    setMessages((list) => [...list, pending]);
    setIsSending(true);
    try {
      const sent = await sendGroupMessage(groupId, content, parentId, metadata);
      setMessages((list) =>
        list.map((item) =>
          item.id === clientId ? { ...sent, status: "sent" } : item,
        ),
      );
    } catch (error) {
      setMessages((list) =>
        list.map((item) =>
          item.id === clientId ? { ...item, status: "failed" } : item,
        ),
      );
      handleError(error, "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const typingSentAtRef = useRef(0);
  const handleTyping = () => {
    const now = Date.now();
    if (now - typingSentAtRef.current < TYPING_THROTTLE_MS) return;
    typingSentAtRef.current = now;
    window.dispatchEvent(
      new CustomEvent("sendRealtimeGroupTyping", {
        detail: { group_id: groupId },
      }),
    );
  };

  const handleDeleteMessage = async (messageId: string, skip = false) => {
    const message = messages.find((item) => item.id === messageId);
    if (!message) return;
    // An unsent message only exists here.
    if (message.status === "failed" || message.status === "pending") {
      setMessages((list) => list.filter((item) => item.id !== messageId));
      return;
    }
    if (!skip) {
      setDeletingMessageId(messageId);
      return;
    }
    setDeletingMessageId(null);
    const previous = messages;
    setMessages((list) => list.filter((item) => item.id !== messageId));
    try {
      await deleteGroupMessage(groupId, messageId);
    } catch (error) {
      setMessages(() => previous);
      handleError(error, "Failed to delete message");
    }
  };

  const handleEditMessage = async (messageId: string, text: string) => {
    const content = prepareMessageContentForApi(text);
    if (!content) return;
    const previous = messages;
    setEditingMessageId(null);
    setMessages((list) =>
      list.map((item) =>
        item.id === messageId
          ? { ...item, content, updatedAt: Date.now() }
          : item,
      ),
    );
    try {
      await editGroupMessage(groupId, messageId, content);
    } catch (error) {
      setMessages(() => previous);
      handleError(error, "Failed to edit message");
    }
  };

  const handleRetry = async (message: Message) => {
    setMessages((list) => list.filter((item) => item.id !== message.id));
    await send(
      message.content,
      (message.metadata as OutgoingMessageMetadata | null) ?? undefined,
      message.parentId ?? null,
    );
  };

  const [isReporting, setIsReporting] = useState(false);
  const submitReport = async () => {
    if (!reportingMessage || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      await reportGroupMessage(
        groupId,
        reportingMessage.id,
        reportReason.trim(),
      );
      toast.success("Report submitted. Thanks for letting us know.");
      setReportingMessage(null);
      setReportReason("");
    } catch (error) {
      handleError(error, "Failed to report message");
    } finally {
      setIsReporting(false);
    }
  };

  const typingUsers = [...(typingUserIds ?? [])]
    .filter((id) => id !== currentUserId)
    .map((id) => usersById.get(id))
    .filter((user): user is MessageUser => !!user);
  const memberCount = group?.memberIds.length ?? 0;
  const canInvite = isOwner && memberCount < GROUP_MEMBER_LIMIT;
  const members = (group?.memberIds ?? []).map(
    (id) =>
      usersById.get(id) ?? {
        id,
        username: `User #${id.slice(-6)}`,
        avatar: "",
      },
  );

  if (groupQuery.isError && !group) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-primary-text text-base font-semibold">
          Unable to load this group
        </p>
        <p className="text-quaternary-text max-w-xs text-sm">
          {groupQuery.error.message}
        </p>
        <Button size="sm" variant="secondary" onClick={onBack}>
          Back to messages
        </Button>
      </div>
    );
  }

  const headerButton =
    "text-secondary-text hover:bg-quaternary-bg hover:text-primary-text flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors";
  // The owner renames the group from its icon or name, like the app.
  const openRename = () => isOwner && setRenameOpen(true);

  return (
    <Chat className="h-full min-h-0">
      <div className="border-border-primary flex items-center gap-2.5 border-b px-3 py-2.5 lg:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className={cn(headerButton, "lg:hidden")}
        >
          <Icon icon="heroicons:arrow-left" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={openRename}
          tabIndex={isOwner ? undefined : -1}
          aria-hidden={isOwner ? undefined : true}
          className={cn(
            "shrink-0 rounded-full",
            isOwner ? "cursor-pointer" : "cursor-default",
          )}
        >
          <GroupAvatar
            name={group?.name ?? ""}
            groupId={groupId}
            memberIds={group?.memberIds}
            className="h-8 w-8"
          />
        </button>
        <button
          type="button"
          onClick={openRename}
          aria-label={isOwner ? "Edit group name" : undefined}
          className={cn(
            "group/name flex min-w-0 flex-1 items-center gap-2 text-left",
            isOwner ? "cursor-pointer" : "cursor-default",
          )}
        >
          <span className="text-primary-text truncate text-sm font-semibold">
            {group?.name ?? "Group"}
          </span>
          {isOwner && (
            <Icon
              icon="heroicons:pencil"
              aria-hidden="true"
              className="text-tertiary-text h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover/name:opacity-100 [@media(hover:none)]:opacity-100"
            />
          )}
          {group && (
            <span className="text-tertiary-text shrink-0 text-xs">
              {memberCount} members
            </span>
          )}
        </button>
        {canInvite && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                aria-label="Invite to group"
                className={headerButton}
              >
                <Icon icon="heroicons:user-plus" className="h-4.5 w-4.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Invite to group</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggleMembers}
              aria-label={showMembers ? "Hide members" : "Show members"}
              aria-pressed={showMembers}
              className={cn(
                headerButton,
                showMembers ? "text-primary-text" : "text-secondary-text",
              )}
            >
              <Icon icon="heroicons:users" className="h-4.5 w-4.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showMembers ? "Hide members" : "Show members"}
          </TooltipContent>
        </Tooltip>
      </div>

      <div ref={setChatRow} className="relative flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <ChatMessages
            ref={containerRef}
            onScroll={() => {
              const container = containerRef.current;
              if (!container) return;
              atBottomRef.current =
                container.scrollHeight -
                  container.scrollTop -
                  container.clientHeight <=
                48;
            }}
            className="relative !flex-col px-2 pt-1 pb-5 sm:px-3"
            style={{ overflowAnchor: "none" }}
          >
            {messagesQuery.hasNextPage && (
              <div className="flex justify-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadOlder}
                  disabled={messagesQuery.isFetchingNextPage}
                >
                  {messagesQuery.isFetchingNextPage
                    ? "Loading…"
                    : "Load older messages"}
                </Button>
              </div>
            )}
            {messagesQuery.isPending ? (
              <div className="flex flex-1 items-center justify-center py-10">
                <Spinner className="h-6 w-6" />
              </div>
            ) : messagesQuery.isError && messages.length === 0 ? (
              <div className="m-auto space-y-3 text-center" role="alert">
                <p className="text-form-error text-sm">
                  {messagesQuery.error.message}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void messagesQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <p className="text-quaternary-text m-auto text-center text-sm">
                No messages yet - say hello.
              </p>
            ) : (
              messages.map((message, index) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  offerDetails={offerDetails}
                  index={index}
                  messages={messages}
                  currentUser={currentUser}
                  currentUserEnriched={null}
                  currentUserMessageUser={currentUserMessageUser}
                  selectedUser={null}
                  usersById={usersById}
                  canDeleteOthers={isOwner}
                  activeMessageId={activeMessageId}
                  replyingToMessage={replyingToMessage}
                  editingMessageId={editingMessageId}
                  emojiStringMap={emojiStringMap}
                  twemojiEnabled={twemojiEnabled}
                  isSending={isSending}
                  deletingMessageId={deletingMessageId}
                  messagesContainerRef={containerRef}
                  setActiveMessageId={setActiveMessageId}
                  setEditingMessageId={setEditingMessageId}
                  setReplyingToMessage={setReplyingToMessage}
                  setReportingMessage={setReportingMessage}
                  setReportReason={setReportReason}
                  handleDeleteMessage={handleDeleteMessage}
                  handleRetryFailedMessage={handleRetry}
                  handleEditMessage={handleEditMessage}
                />
              ))
            )}
          </ChatMessages>

          <ComposerBar
            messageBan={messageBan}
            replying={
              replyingToMessage
                ? {
                    message: replyingToMessage,
                    sender: usersById.get(replyingToMessage.senderId) ?? null,
                  }
                : null
            }
            onCancelReply={() => setReplyingToMessage(null)}
            typingUsers={typingUsers}
            conversationId={`group:${groupId}`}
            placeholder={`Message ${group?.name ?? "the group"}...`}
            isSending={isSending}
            disabled={!!messageBan}
            actions={
              currentUserId ? (
                <ComposerActionsMenu
                  userId={currentUserId}
                  recipientLabel={group?.name ?? "the group"}
                  disabled={isSending || !!messageBan}
                  onSend={(content, metadata) => void send(content, metadata)}
                />
              ) : null
            }
            onSend={(content, metadata) => void send(content, metadata)}
            onTyping={handleTyping}
          />
        </div>
        {group && showMembers && (
          <div
            className={
              membersNarrow
                ? "animate-in slide-in-from-right-4 fade-in-0 absolute inset-y-0 right-0 z-20 flex shadow-2xl duration-150"
                : "flex"
            }
          >
            <GroupMembersPanel
              group={group}
              members={members}
              currentUserId={currentUserId}
              typingUserIds={typingUserIds ?? NO_TYPERS}
              onUpdated={setGroup}
              onInvite={canInvite ? () => setInviteOpen(true) : null}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deletingMessageId}
        onClose={() => setDeletingMessageId(null)}
        onConfirm={() =>
          deletingMessageId && void handleDeleteMessage(deletingMessageId, true)
        }
        title="Delete Message"
        confirmText="Delete"
        confirmVariant="destructive"
        message="Are you sure you want to delete this message? This action cannot be undone."
      />

      <AppDialog
        open={!!reportingMessage}
        onOpenChange={(open) => {
          if (!open) {
            setReportingMessage(null);
            setReportReason("");
          }
        }}
        title="Report message"
        footer={
          <>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReportingMessage(null)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!reportReason.trim() || isReporting}
              onClick={() => void submitReport()}
            >
              {isReporting ? "Reporting…" : "Report"}
            </Button>
          </>
        }
      >
        <textarea
          value={reportReason}
          onChange={(event) => setReportReason(event.target.value)}
          placeholder="Why are you reporting this message?"
          rows={3}
          maxLength={500}
          className="border-border-card bg-form-input text-primary-text focus:border-border-focus w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none"
        />
      </AppDialog>

      {group && (
        <UserPickerDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          title={`Invite to ${group.name}`}
          subtitle={`Group chats can have up to ${GROUP_MEMBER_LIMIT} members.`}
          confirmLabel="Invite"
          currentUserId={currentUserId}
          suggested={suggestedUsers}
          excludeIds={group.memberIds}
          maxSelect={GROUP_MEMBER_LIMIT - memberCount}
          onConfirm={async (users) => {
            try {
              setGroup(
                await addGroupMembers(
                  groupId,
                  users.map((user) => user.id),
                ),
              );
            } catch (error) {
              // A messaging ban closes the modal with its own toast.
              if (error instanceof GroupChatError && error.ban) {
                handleError(error, "");
                return;
              }
              throw error;
            }
          }}
        />
      )}

      {group && (
        <RenameGroupDialog
          open={renameOpen}
          onOpenChange={setRenameOpen}
          group={group}
          onUpdated={setGroup}
        />
      )}
    </Chat>
  );
}
