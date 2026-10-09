import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { SupporterGift } from "@/types/auth";
import type { ConversationSummary, Message } from "@/utils/messages/types";
import * as parsing from "@/utils/messages/parsing";
import { MESSAGE_CHAR_LIMIT } from "@/utils/messages/types";
import type { useSendMessage } from "./useSendMessage";

test("sending a reply carries its parent id through the request, optimistic message and server result", async () => {
  const parent: Message = {
    id: "parent",
    senderId: "recipient",
    receiverId: "me",
    content: "original",
  };
  let messages: Message[] = [parent];
  let reply: Message | null = parent;
  const requests: Record<string, unknown>[] = [];
  const optimistic: Message[] = [];
  const errors: unknown[] = [];
  const sending: boolean[] = [];
  const exports = {} as { useSendMessage: typeof useSendMessage };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useSendMessage.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      fetch: async (_url: string, options: { body: string }) => {
        requests.push(JSON.parse(options.body));
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              success: true,
              message: {
                id: "server",
                parent_id: "parent",
                user_id: "me",
                recipient_id: "recipient",
                content: "reply",
              },
            }),
        };
      },
      require: (name: string) => {
        if (name === "@/utils/messages/parsing") return parsing;
        if (name === "@/utils/messages/types") return { MESSAGE_CHAR_LIMIT };
        if (name === "@/utils/messages/sorting")
          return {
            createClientMessageId: () => "client",
            sortMessagesByCreatedAt: (items: Message[]) => items,
          };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://example.test" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "@/services/logger")
          return {
            createLogger: () => ({
              error: (...args: unknown[]) => errors.push(args),
            }),
          };
        if (name === "sonner")
          return {
            toast: { error: (message: unknown) => errors.push(message) },
          };
        return {};
      },
    },
  );
  const options = {
    selectedUserId: "recipient",
    selectedUser: { id: "recipient", username: "Recipient", avatar: "" },
    currentUser: { id: "me" },
    isSending: false,
    replyingToMessage: parent,
    selectedUserIdRef: { current: "recipient" },
    pendingOwnSendScrollRef: { current: false },
    readMessageIdsRef: { current: new Set() },
    prepareMessageContentForApi: (content: string) => content,
    prepareMessageDisplayContent: (content: string) => content,
    setIsSending: (value: boolean) => sending.push(value),
    setMessages: (updater: (items: Message[]) => Message[]) => {
      messages = updater(messages);
    },
    setConversations: () => {},
    setReplyingToMessage: () => {
      reply = null;
    },
    upsertLocalThreadMessage: (_id: string, message: Message) =>
      optimistic.push(message),
    updateLocalThreadMessage: () => {},
  } as unknown as Parameters<typeof useSendMessage>[0];
  await exports.useSendMessage(options).handleSendMessage("reply");
  expect(errors).toEqual([]);
  expect(requests).toEqual([{ content: "reply", parent_id: "parent" }]);
  expect(optimistic[0]).toMatchObject({
    parentId: "parent",
    status: "pending",
  });
  expect(messages[1]).toMatchObject({
    id: "server",
    parentId: "parent",
    status: "sent",
  });
  expect(reply).toBeNull();
  expect(sending).toEqual([true, false]);
});

test("gift redemption creates a distinct sender embed per gift without posting a second message", async () => {
  let messages: Message[] = [];
  let conversations: ConversationSummary[] = [];
  let local: Message[] = [];
  let id = 0;
  let rejectGift = false;
  let finish: () => void = () => {};
  const redemptions: string[][] = [];
  const exports = {} as {
    useSendMessage: (options: unknown) => {
      handleSendGift: (gift: SupporterGift) => Promise<void>;
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useSendMessage.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      fetch: () => {
        throw new Error("Gift redemption must not POST an ordinary message");
      },
      require: (name: string) => {
        if (name === "@/services/settingsService")
          return {
            giftSupporterGift: async (shareId: string, recipientId: string) => {
              redemptions.push([shareId, recipientId]);
              if (rejectGift) throw new Error("Gift already redeemed");
              await new Promise<void>((resolve) => {
                finish = resolve;
              });
            },
          };
        if (name === "@/utils/messages/sorting")
          return {
            createClientMessageId: () => `client-${++id}`,
            sortMessagesByCreatedAt: (items: Message[]) => items,
          };
        if (name === "@/utils/messages/parsing") return { asId: String };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        return {};
      },
    },
  );
  const { handleSendGift } = exports.useSendMessage({
    selectedUserId: "recipient",
    selectedUser: { id: "recipient", username: "Recipient", avatar: "" },
    currentUser: { id: "jalen", username: "Jalen" },
    isSending: false,
    selectedUserIdRef: { current: "recipient" },
    pendingOwnSendScrollRef: { current: false },
    setIsSending: () => {},
    setMessages: (updater: (items: Message[]) => Message[]) => {
      messages = updater(messages);
    },
    setConversations: (
      updater: (items: ConversationSummary[]) => ConversationSummary[],
    ) => {
      conversations = updater(conversations);
    },
    upsertLocalThreadMessage: (_userId: string, message: Message) => {
      local.push(message);
    },
    updateLocalThreadMessage: (
      _userId: string,
      predicate: (message: Message) => boolean,
      patch: (message: Message) => Message,
    ) => {
      local = local.map((message) =>
        predicate(message) ? patch(message) : message,
      );
    },
  });
  const gift: SupporterGift = {
    id: 1,
    share_id: "gift-1",
    level: 1,
    user: "jalen",
    purchase_id: "purchase",
    sku_id: "sku",
    created_at: 1,
  };
  const first = handleSendGift(gift);
  expect(messages[0].status).toBe("pending");
  expect(messages[0].metadata).toEqual({ type: "gift_sent", level: 1 });
  expect(messages[0].content).toBe("Jalen sent you a Supporter 1 gift!");
  finish();
  await first;
  expect(messages[0].status).toBe("sent");
  const second = handleSendGift({ ...gift, id: 2, share_id: "gift-2" });
  expect(messages).toHaveLength(2);
  expect(messages[0].id).not.toBe(messages[1].id);
  finish();
  await second;
  expect(local.map((message) => message.metadata)).toEqual([
    { type: "gift_sent", level: 1 },
    { type: "gift_sent", level: 1 },
  ]);
  expect(redemptions).toEqual([
    ["gift-1", "recipient"],
    ["gift-2", "recipient"],
  ]);
  rejectGift = true;
  await expect(
    handleSendGift({ ...gift, share_id: "already-redeemed" }),
  ).rejects.toThrow("Gift already redeemed");
  expect(messages.at(-1)?.status).toBe("failed");
});
