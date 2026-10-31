import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  createGroupChat,
  fetchGroupChats,
  fetchGroupIcon,
  GroupChatError,
} from "./groupChats";
import { mergeConversationList } from "@/components/Users/Messages/ConversationSidebar";

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

const respond = (body: string, status = 200) => {
  globalThis.fetch = (async () =>
    new Response(body, { status })) as unknown as typeof fetch;
};

test("group lists keep snowflake ids and map messages onto the shared type", async () => {
  // Raw JSON: these ids are past 2^53 and would lose digits as numbers.
  respond(`{"groups":[{"id":1234567890123456789,"name":"Crew","owner_id":"1",
    "created_at":1700000000,"member_ids":["1","2"],"unread_count":3,
    "message":{"id":9876543210987654321,"group_id":1234567890123456789,
      "sender_id":"2","content":"hi","created_at":1700000100}}],"total_groups":1}`);
  const [group] = await fetchGroupChats();
  expect(group.id).toBe("1234567890123456789");
  expect(group.unreadCount).toBe(3);
  expect(group.memberIds).toEqual(["1", "2"]);
  expect(group.createdAt).toBe(1_700_000_000_000);
  expect(group.lastMessage?.id).toBe("9876543210987654321");
  expect(group.lastMessage?.receiverId).toBe("1234567890123456789");
  expect(group.lastMessage?.senderId).toBe("2");
});

test("event metadata keeps large user ids", async () => {
  respond(`{"groups":[{"id":"1","name":"Crew","owner_id":"1","created_at":1,
    "member_ids":["1"],"unread_count":0,"message":{"id":"m","group_id":"1",
    "sender_id":"1","content":"left the group","created_at":2,
    "metadata":{"type":"member_left","user_id":1234567890123456789,
      "new_owner_id":9876543210987654321,"user_ids":[1234567890123456789]}}}]}`);
  const [group] = await fetchGroupChats();
  expect(group.lastMessage?.metadata).toEqual({
    type: "member_left",
    user_id: "1234567890123456789",
    new_owner_id: "9876543210987654321",
    user_ids: ["1234567890123456789"],
  });
});

test("an unmessageable member comes back named on the error", async () => {
  respond(
    JSON.stringify({
      error: "unmessageable",
      user_id: "42",
      message: "Can't add them",
    }),
    400,
  );
  const error = await createGroupChat("Crew", ["42"]).catch((e) => e);
  expect(error).toBeInstanceOf(GroupChatError);
  expect(error.code).toBe("unmessageable");
  expect(error.userId).toBe("42");
});

test("DMs and groups share one list, newest activity first", () => {
  const dm = (id: string, at?: number) => ({
    user: { id, username: id, avatar: "" },
    lastMessage: at
      ? {
          id: `m${id}`,
          senderId: id,
          receiverId: "me",
          content: "",
          createdAt: at,
        }
      : undefined,
  });
  const group = (id: string, createdAt: number, at?: number) => ({
    id,
    name: id,
    ownerId: "me",
    createdAt,
    memberIds: ["me"],
    unreadCount: 0,
    lastMessage: at
      ? {
          id: `g${id}`,
          senderId: "me",
          receiverId: id,
          content: "",
          createdAt: at,
        }
      : null,
  });
  const order = mergeConversationList(
    [
      dm("old-dm", 100),
      dm("new-dm", 300),
      dm("silent-dm"),
      { ...dm("new-friend"), openedAt: 350 },
    ],
    [group("busy-group", 50, 400), group("new-group", 200)],
  ).map((entry) => `${entry.kind}:${entry.id}`);
  expect(order).toEqual([
    "group:busy-group",
    "dm:new-friend",
    "dm:new-dm",
    "group:new-group",
    "dm:old-dm",
    "dm:silent-dm",
  ]);
});

test("the group icon is fetched with the API's auth, not as a bare <img>", async () => {
  const env = process.env as Record<string, string | undefined>;
  const saved = {
    stage: env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME,
    token: env.NEXT_PUBLIC_DEV_TOKEN,
  };
  // Local dev: the API is on another domain, so the token goes in a header.
  env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME = "development";
  env.NEXT_PUBLIC_DEV_TOKEN = "dev-token";
  let request: { url: string; init?: RequestInit } | undefined;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    request = { url: String(url), init };
    return new Response(new Blob(["icon"], { type: "image/webp" }));
  }) as unknown as typeof fetch;
  try {
    const icon = await fetchGroupIcon("123", "abc");
    expect(icon.type).toBe("image/webp");
    expect(request?.url).toBe(
      "https://api.example.com/v2/group-chats/123/icon?v=abc",
    );
    expect(request?.init?.credentials).toBe("include");
    expect(
      (request?.init?.headers as Record<string, string>).Authorization,
    ).toBe("dev-token");
  } finally {
    env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME = saved.stage;
    env.NEXT_PUBLIC_DEV_TOKEN = saved.token;
    if (saved.stage === undefined)
      delete env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME;
    if (saved.token === undefined) delete env.NEXT_PUBLIC_DEV_TOKEN;
  }
});
