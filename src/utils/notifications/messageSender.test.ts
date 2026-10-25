import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { getDisplayName } from "@/utils/messages/formatting";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";

function loadSender(
  fetch: (url: string, init: RequestInit) => Promise<Response>,
  signalApi = AbortSignal,
) {
  const exports = {} as typeof import("./messageSender");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./messageSender.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      fetch,
      AbortSignal: signalApi,
      require: (name: string) => {
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.test" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: { Authorization: "test-token" },
            }),
          };
        if (name === "@/utils/api/parseJsonWithLargeIds")
          return { parseJsonWithLargeIds };
        if (name === "@/utils/messages/formatting") return { getDisplayName };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  return exports;
}

test("message senders reuse profile, member and conversation caches", async () => {
  const client = new QueryClient();
  const user = {
    id: "123",
    username: "sencha",
    global_name: "Sencha",
    avatar: "",
  };
  const sender = loadSender(async () => {
    throw new Error("Unexpected fetch");
  });
  try {
    for (const [key, data] of [
      [["message-user-lookup", "123", "id,username"], user],
      [["message-users-batch", ["123"]], [user]],
      [["conversation-list", "me"], { items: [{ user }] }],
    ] as const) {
      client.setQueryData(key, data);
      expect(await sender.resolveMessageSenderName(client, "123")).toBe(
        "Sencha",
      );
      expect(sender.cachedMessageUsername(client, "456")).toBeNull();
      client.clear();
    }
  } finally {
    client.clear();
  }
});

test("cold sender lookups share a request, preserve large IDs and cache names without an avatar", async () => {
  const client = new QueryClient();
  let requests = 0;
  const sender = loadSender(async (url, init) => {
    requests++;
    expect(url).toBe(
      "https://api.example.test/v2/users/1234567890123456789?fields=id,username,global_name",
    );
    expect(init.credentials).toBe("include");
    expect(init.headers).toEqual({ Authorization: "test-token" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    return new Response(
      '{"id":1234567890123456789,"username":"sencha","global_name":"Sencha"}',
    );
  });
  try {
    expect(
      await Promise.all([
        sender.resolveMessageSenderName(client, "1234567890123456789"),
        sender.resolveMessageSenderName(client, "1234567890123456789"),
      ]),
    ).toEqual(["Sencha", "Sencha"]);
    expect(
      await sender.resolveMessageSenderName(client, "1234567890123456789"),
    ).toBe("Sencha");
    expect(requests).toBe(1);
    expect(sender.cachedMessageUsername(client, "1234567890123456789")).toBe(
      "Sencha",
    );
  } finally {
    client.clear();
  }
});

test("missing display names use usernames, while failed and invalid lookups fall back", async () => {
  const client = new QueryClient();
  let response = Response.json({
    id: "123",
    username: "sencha",
    global_name: "None",
  });
  const sender = loadSender(async () => response);
  try {
    expect(await sender.resolveMessageSenderName(client, "123")).toBe("sencha");
    for (const next of [
      Response.json({}, { status: 503 }),
      Response.json({ id: "other", username: "Wrong person" }),
      Response.json({ id: "123", username: "", global_name: "  " }),
      Response.json(null),
      new Response("invalid JSON"),
    ]) {
      client.clear();
      response = next;
      expect(await sender.resolveMessageSenderName(client, "123")).toBeNull();
    }
  } finally {
    client.clear();
  }
});

test("sender lookup timeout falls back instead of losing the notification", async () => {
  const client = new QueryClient();
  const signalApi = {
    any: AbortSignal.any,
    timeout: (ms: number) => {
      expect(ms).toBe(2000);
      return AbortSignal.abort(new DOMException("Timed out", "TimeoutError"));
    },
  } as typeof AbortSignal;
  const sender = loadSender(async (_url, init) => {
    init.signal!.throwIfAborted();
    throw new Error("Expected timeout");
  }, signalApi);
  try {
    expect(await sender.resolveMessageSenderName(client, "123")).toBeNull();
  } finally {
    client.clear();
  }
});
