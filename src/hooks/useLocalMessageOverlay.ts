"use client";

import { useCallback, useRef } from "react";
import type { Message } from "@/utils/messages/types";
import { trimLocalThreadMessages } from "@/utils/messages/sorting";

export function useLocalMessageOverlay() {
  const localThreadMessagesByUserIdRef = useRef<Map<string, Message[]>>(
    new Map(),
  );

  const upsertLocalThreadMessage = useCallback(
    (counterpartUserId: string, message: Message) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const idx = existing.findIndex((m) => m.id === message.id);
      if (idx !== -1) {
        const next = [...existing];
        next[idx] = { ...next[idx], ...message };
        store.set(counterpartUserId, trimLocalThreadMessages(next));
        return;
      }
      if (message.clientId) {
        const clientIdx = existing.findIndex(
          (m) => m.clientId === message.clientId,
        );
        if (clientIdx !== -1) {
          const next = [...existing];
          next[clientIdx] = { ...next[clientIdx], ...message };
          store.set(counterpartUserId, trimLocalThreadMessages(next));
          return;
        }
      }
      store.set(
        counterpartUserId,
        trimLocalThreadMessages([...existing, message]),
      );
    },
    [],
  );

  const updateLocalThreadMessage = useCallback(
    (
      counterpartUserId: string,
      predicate: (message: Message) => boolean,
      patch: (message: Message) => Message,
    ) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const idx = existing.findIndex(predicate);
      if (idx === -1) return;
      const next = [...existing];
      next[idx] = patch(next[idx] as Message);
      store.set(counterpartUserId, trimLocalThreadMessages(next));
    },
    [],
  );

  const removeLocalThreadMessage = useCallback(
    (counterpartUserId: string, predicate: (message: Message) => boolean) => {
      const store = localThreadMessagesByUserIdRef.current;
      const existing = store.get(counterpartUserId) ?? [];
      const next = existing.filter((m) => !predicate(m));
      store.set(counterpartUserId, next);
    },
    [],
  );

  return {
    localThreadMessagesByUserIdRef,
    upsertLocalThreadMessage,
    updateLocalThreadMessage,
    removeLocalThreadMessage,
  };
}
