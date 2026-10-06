import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { SupporterGift } from "@/types/auth";
import type { ConversationSummary, Message } from "@/utils/messages/types";

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
