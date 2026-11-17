import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { QueryClient } from "@tanstack/react-query";
import type { useMessagesRealtime } from "./useMessagesRealtime";
import type { ConversationSummary, MessageUser } from "@/utils/messages/types";

test("presence updates all cached group members and DMs, validates status and cleans up", () => {
  const client = new QueryClient();
  const member: MessageUser = {
    id: "member",
    username: "Member",
    avatar_url: "",
    presence: { status: "Offline", last_updated: 0 },
  };
  const other = { ...member, id: "other" };
  const keys = [
    ["message-users-batch", ["member", "other"]],
    ["message-users-batch", ["member"]],
  ];
  keys.forEach((key) => client.setQueryData(key, [member, other]));
  client.setQueryData(["unrelated"], [member]);
  let conversations: ConversationSummary[] = [{ user: member }];
  const listeners = new Map<string, (event: unknown) => void>();
  const cleanups: (() => void)[] = [];
  const noop = () => {};
  const exports = {} as { useMessagesRealtime: typeof useMessagesRealtime };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useMessagesRealtime.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      window: {
        addEventListener: (name: string, callback: (event: unknown) => void) =>
          listeners.set(name, callback),
        removeEventListener: (name: string) => listeners.delete(name),
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useRef: (current: unknown) => ({ current }),
            useState: (initial: () => unknown) => [initial(), noop],
            useSyncExternalStore: () => true,
            useEffect: (effect: () => () => void) => cleanups.push(effect()),
          };
        if (name === "@tanstack/react-query")
          return { useQueryClient: () => client };
        if (name === "@/utils/messages/parsing") return { asId: String };
        return {};
      },
    },
  );
  exports.useMessagesRealtime({
    currentUserId: "me",
    isAuthenticated: true,
    selectedUserIdRef: { current: null },
    readMessageIdsRef: { current: new Set() },
    isAtBottomRef: { current: true },
    pendingRealtimeReadUserIdsRef: { current: new Set() },
    localThreadMessagesByUserIdRef: { current: new Map() },
    updateLocalThreadMessage: noop,
    upsertLocalThreadMessage: noop,
    removeLocalThreadMessage: noop,
    setMessages: noop,
    setConversations: (update) => {
      conversations =
        typeof update === "function" ? update(conversations) : update;
    },
    setReplyingToMessage: noop,
  });
  const send = (status: string) =>
    listeners.get("realtimeMessage")!({
      detail: {
        action: "presence_update",
        data: { user_id: "member", status },
      },
    });
  for (const status of ["Online", "Offline"] as const) {
    send(status);
    for (const key of keys) {
      const users = client.getQueryData<MessageUser[]>(key)!;
      expect(users[0].presence?.status).toBe(status);
      expect(users[0].presence!.last_updated).toBeLessThan(1e12);
      expect(users[1]).toBe(other);
    }
    expect(conversations[0].user.presence?.status).toBe(status);
  }
  send("invalid");
  expect(client.getQueryData<MessageUser[]>(keys[0])![0].presence?.status).toBe(
    "Offline",
  );
  expect(client.getQueryData(["unrelated"])).toEqual([member]);
  cleanups.forEach((cleanup) => cleanup());
  expect(listeners.size).toBe(0);
  client.clear();
});
