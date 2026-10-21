"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchGroupChats,
  parseGroup,
  parseGroupMessage,
  type GroupChatSummary,
} from "@/utils/api/groupChats";

/** Clears a typing indicator this long after the last typing event. */
const TYPING_TIMEOUT_MS = 5000;

export type RealtimeGroupEventDetail = {
  action: string;
  data: Record<string, unknown>;
};

export const groupChatsKey = (userId: string | null) =>
  ["group-chats", userId] as const;

/**
 * The signed-in user's group chats, kept current from the websocket: groups
 * created, renamed, changed or deleted, new messages (moving a group up and
 * counting unread ones), and who is typing in each.
 */
export function useGroupChats({
  userId,
  enabled,
  openGroupId,
}: {
  userId: string | null;
  enabled: boolean;
  /** The group on screen; its new messages don't count as unread. */
  openGroupId: string | null;
}) {
  const queryClient = useQueryClient();
  const key = useMemo(() => groupChatsKey(userId), [userId]);
  const query = useQuery({
    queryKey: key,
    queryFn: fetchGroupChats,
    enabled: enabled && !!userId,
    staleTime: 30_000,
    retry: false,
  });

  const setGroups = useCallback(
    (update: (groups: GroupChatSummary[]) => GroupChatSummary[]) =>
      queryClient.setQueryData<GroupChatSummary[]>(key, (previous) =>
        update(previous ?? []),
      ),
    [queryClient, key],
  );

  const markGroupRead = useCallback(
    (groupId: string) =>
      setGroups((groups) =>
        groups.map((group) =>
          group.id === groupId && group.unreadCount
            ? { ...group, unreadCount: 0 }
            : group,
        ),
      ),
    [setGroups],
  );

  const [typing, setTyping] = useState<Map<string, Set<string>>>(
    () => new Map(),
  );
  const typingTimeoutsRef = useRef(new Map<string, number>());
  const setTypingFor = useCallback(
    (groupId: string, typingUserId: string, isTyping: boolean) => {
      const timeoutKey = `${groupId}:${typingUserId}`;
      window.clearTimeout(typingTimeoutsRef.current.get(timeoutKey));
      typingTimeoutsRef.current.delete(timeoutKey);
      if (isTyping) {
        typingTimeoutsRef.current.set(
          timeoutKey,
          window.setTimeout(
            () => setTypingFor(groupId, typingUserId, false),
            TYPING_TIMEOUT_MS,
          ),
        );
      }
      setTyping((previous) => {
        const current = previous.get(groupId) ?? new Set<string>();
        if (current.has(typingUserId) === isTyping) return previous;
        const nextUsers = new Set(current);
        if (isTyping) nextUsers.add(typingUserId);
        else nextUsers.delete(typingUserId);
        const next = new Map(previous);
        if (nextUsers.size) next.set(groupId, nextUsers);
        else next.delete(groupId);
        return next;
      });
    },
    [],
  );
  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) window.clearTimeout(timeout);
      timeouts.clear();
    };
  }, []);

  const openGroupIdRef = useRef(openGroupId);
  useEffect(() => {
    openGroupIdRef.current = openGroupId;
  }, [openGroupId]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const onEvent = (event: Event) => {
      const { action, data } = (event as CustomEvent<RealtimeGroupEventDetail>)
        .detail;
      if (action === "group_updated") {
        const group = parseGroup(data);
        if (!group) return;
        setGroups((groups) =>
          groups.some((item) => item.id === group.id)
            ? groups.map((item) =>
                item.id === group.id ? { ...item, ...group } : item,
              )
            : [{ ...group, unreadCount: 0, lastMessage: null }, ...groups],
        );
        return;
      }
      if (action === "group_deleted") {
        const id = String(data.id);
        setGroups((groups) => groups.filter((group) => group.id !== id));
        return;
      }
      if (action === "typing" && data.group_id != null) {
        if (String(data.user_id) !== userId) {
          setTypingFor(String(data.group_id), String(data.user_id), true);
        }
        return;
      }
      if (
        action === "group_message_received" ||
        action === "group_message_sent"
      ) {
        const message = parseGroupMessage(data);
        if (!message) return;
        const groupId = message.receiverId;
        setTypingFor(groupId, message.senderId, false);
        const counts =
          action === "group_message_received" &&
          openGroupIdRef.current !== groupId;
        let known = false;
        setGroups((groups) =>
          groups.map((group) => {
            if (group.id !== groupId) return group;
            known = true;
            return {
              ...group,
              lastMessage: message,
              unreadCount: group.unreadCount + (counts ? 1 : 0),
            };
          }),
        );
        // A group this tab hasn't loaded yet: fetch the list again.
        if (!known) void queryClient.invalidateQueries({ queryKey: key });
      }
    };
    window.addEventListener("realtimeGroup", onEvent);
    return () => window.removeEventListener("realtimeGroup", onEvent);
  }, [enabled, userId, setGroups, setTypingFor, queryClient, key]);

  return {
    groups: query.data ?? [],
    isLoading: query.isPending && enabled && !!userId,
    error: query.error?.message ?? null,
    groupTypingUserIds: typing,
    setGroups,
    markGroupRead,
  };
}
