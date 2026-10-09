import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as parsing from "@/utils/messages/parsing";
import type { Message } from "@/utils/messages/types";
import type { useMessageMutations } from "./useMessageMutations";

test("edit saves use the submitted local draft and leave editing open on failure", async () => {
  let messages: Message[] = [
    {
      id: "message",
      senderId: "me",
      receiverId: "them",
      content: "original",
      createdAt: 1,
    },
  ];
  let editingId: string | null = "message";
  let fail = false;
  const requests: unknown[] = [];
  const errors: unknown[] = [];
  const sending: boolean[] = [];
  const exports = {} as { useMessageMutations: typeof useMessageMutations };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useMessageMutations.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: async (_url: string, options: { body: string }) => {
        requests.push(JSON.parse(options.body));
        return {
          ok: !fail,
          text: async () =>
            JSON.stringify(
              fail
                ? { message: "Unable to save this message." }
                : {
                    success: true,
                    message: {
                      id: "message",
                      user_id: "me",
                      recipient_id: "them",
                      content: "latest draft",
                    },
                  },
            ),
        };
      },
      require: (name: string) => {
        if (name === "@/utils/messages/parsing") return parsing;
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.test" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
        if (name === "@/utils/api/ban") return { parseBan: () => null };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "sonner")
          return {
            toast: {
              loading: () => "toast",
              success: () => {},
              error: (error: unknown) => errors.push(error),
            },
          };
        return {};
      },
    },
  );
  const options = {
    selectedUserId: "them",
    isSending: false,
    messages,
    prepareMessageContentForApi: (content: string) => content.trim(),
    prepareMessageDisplayContent: (content: string) => content.trim(),
    setIsSending: (value: boolean) => sending.push(value),
    setEditingMessageId: (value: string | null) => {
      editingId = value;
    },
    setMessages: (update: (items: Message[]) => Message[]) => {
      messages = update(messages);
    },
    updateLocalThreadMessage: () => {},
    setConversations: () => {},
  } as unknown as Parameters<typeof useMessageMutations>[0];
  await exports
    .useMessageMutations(options)
    .handleEditMessage("message", "latest draft");
  expect(requests).toEqual([{ content: "latest draft" }]);
  expect(messages[0].content).toBe("latest draft");
  expect(editingId).toBeNull();
  expect(sending).toEqual([true, false]);
  options.messages = messages;
  editingId = "message";
  fail = true;
  await exports
    .useMessageMutations(options)
    .handleEditMessage("message", "draft to retry");
  expect(requests[1]).toEqual({ content: "draft to retry" });
  expect(editingId).toBe("message");
  expect(messages[0].content).toBe("latest draft");
  expect(errors).toEqual(["Unable to save this message."]);
  await exports
    .useMessageMutations(options)
    .handleEditMessage("message", "latest draft");
  expect(editingId).toBeNull();
  expect(requests).toHaveLength(2);
});
