import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { getResponseErrorMessage } from "@/utils/api/api";
import type { reactToMessage } from "./reactions";
import type { MessageReactions } from "./types";

test.each(["/v2/conversations/2/messages/1", "/v2/group-chats/2/messages/1"])(
  "invalid_emoji from %s needs no allowed list and restores reactions",
  async (path) => {
    const exports = {} as { reactToMessage: typeof reactToMessage };
    const errors: string[] = [];
    const changes: MessageReactions[] = [];
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./reactions.ts", import.meta.url), "utf8"),
        { compilerOptions: { module: ModuleKind.CommonJS } },
      ).outputText,
      {
        exports,
        process: { env: {} },
        require: (name: string) => {
          if (name === "sonner")
            return {
              toast: { error: (message: string) => errors.push(message) },
            };
          if (name === "@/utils/api/api") return { getResponseErrorMessage };
          if (name === "@/utils/api/apiDevToken")
            return {
              buildApiFetchRequest: (_base: unknown, requestPath: string) => ({
                url: `https://api.test${requestPath}`,
                headers: {},
              }),
            };
          if (name === "@/hooks/useFrequentEmojis")
            return { recordEmojiUse: () => {} };
          return {};
        },
        fetch: async (url: string) => {
          expect(new URL(url).pathname).toBe(`${path}/reactions`);
          expect(new URL(url).searchParams.get("emoji")).toBe("🇺🇸");
          return Response.json(
            {
              error: "invalid_emoji",
              message: "Emoji not allowed",
              emoji: "🇺🇸",
            },
            { status: 400 },
          );
        },
      },
    );
    await exports.reactToMessage({
      message: {
        id: "1",
        senderId: "2",
        receiverId: "3",
        content: "",
        reactions: { "👍": ["4"] },
      },
      emoji: "🇺🇸",
      userId: "3",
      path,
      setReactions: (value) => changes.push(value),
    });
    expect(changes).toEqual([{ "👍": ["4"], "🇺🇸": ["3"] }, { "👍": ["4"] }]);
    expect(errors).toEqual(["Emoji not allowed"]);
  },
);
