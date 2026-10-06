import { expect, test } from "bun:test";
import {
  buildRobloxGameLink,
  findLocalMessageConfirmation,
  parseMessageEmbed,
} from "./invites";
import type { Message } from "./types";
import { formatSystemMessageContent } from "./formatting";

const jobId = "12345678-1234-1234-1234-123456789abc";

test("back-to-back same-tier gifts keep their local metadata and confirm one distinct message at a time", () => {
  const first: Message = {
    id: "local-1",
    clientId: "local-1",
    senderId: "jalen",
    receiverId: "recipient",
    content: "Jalen sent you a Supporter 1 gift!",
    metadata: { type: "gift_sent", level: 1 },
    status: "sent",
    createdAt: 1000,
  };
  const second = {
    ...first,
    id: "local-2",
    clientId: "local-2",
    createdAt: 2000,
    status: "pending" as const,
  };
  const confirmation = {
    ...first,
    id: "server-1",
    clientId: undefined,
    metadata: undefined,
  };
  const local = [first, second];
  expect(findLocalMessageConfirmation(local, confirmation, 3000)?.id).toBe(
    "local-1",
  );
  local[0] = { ...first, id: "server-1" };
  expect(findLocalMessageConfirmation(local, confirmation, 3000)?.id).toBe(
    "server-1",
  );
  expect(
    findLocalMessageConfirmation(
      local,
      { ...confirmation, id: "server-2" },
      3000,
    )?.id,
  ).toBe("local-2");
  expect(
    findLocalMessageConfirmation(
      local,
      { ...confirmation, id: "server-2", receiverId: "other" },
      3000,
    ),
  ).toBeUndefined();
  expect(
    findLocalMessageConfirmation(
      local,
      { ...confirmation, id: "server-2" },
      40000,
    ),
  ).toBeUndefined();
  expect(
    findLocalMessageConfirmation(
      [{ ...second, status: "failed" }],
      { ...confirmation, id: "server-2" },
      3000,
    ),
  ).toBeUndefined();
});

test("gift previews describe sending from the viewer's perspective", () => {
  const message = {
    id: "1",
    senderId: "jalen",
    receiverId: "recipient",
    content: "Jalen sent you a Supporter 1 gift!",
    metadata: { type: "gift_sent", level: 1 },
  };
  const sender = { id: "jalen", username: "Jalen", avatar: "" };
  expect(formatSystemMessageContent(message, "jalen", sender)).toBe(
    "Sent a Supporter 1 gift!",
  );
  expect(formatSystemMessageContent(message, "recipient", sender)).toBe(
    "Jalen sent you a Supporter 1 gift!",
  );
  expect(
    formatSystemMessageContent(
      { ...message, status: "pending" },
      "jalen",
      sender,
    ),
  ).toBe("Sending a Supporter 1 gift…");
  expect(
    formatSystemMessageContent(
      { ...message, status: "failed" },
      "jalen",
      sender,
    ),
  ).toBe("Gift was not sent.");
});

test("received game invites open the game or the exact server when supplied", () => {
  const game = {
    type: "game_invite" as const,
    place_id: "606849621",
    job_id: null,
  };
  expect(buildRobloxGameLink(game)).toBe(
    "roblox://experiences/start?placeId=606849621",
  );
  const server = { ...game, job_id: jobId };
  expect(parseMessageEmbed(server)).toEqual(server);
  expect(buildRobloxGameLink(server)).toBe(
    `roblox://experiences/start?placeId=606849621&gameInstanceId=${jobId}`,
  );
  expect(
    parseMessageEmbed({ ...game, job_id: "invalid&other=value" }),
  ).toBeNull();
});

test("only valid invite and gift metadata becomes a card", () => {
  expect(
    parseMessageEmbed({ type: "vip_server_invite", server_id: 42 }),
  ).toEqual({ type: "vip_server_invite", server_id: 42 });
  expect(parseMessageEmbed({ type: "gift_sent", level: 3 })).toEqual({
    type: "gift_sent",
    level: 3,
  });
  expect(
    parseMessageEmbed({ type: "game_invite", place_id: "606849621" }),
  ).toEqual({ type: "game_invite", place_id: "606849621", job_id: null });
  for (const metadata of [
    null,
    { type: "offer_accepted" },
    { type: "vip_server_invite", server_id: "42" },
    { type: "vip_server_invite", server_id: -1 },
    { type: "gift_sent", level: 0 },
    { type: "game_invite", place_id: "javascript:alert(1)" },
  ])
    expect(parseMessageEmbed(metadata)).toBeNull();
});
