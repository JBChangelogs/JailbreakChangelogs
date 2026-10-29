import { describe, expect, test } from "bun:test";

import { parseJsonWithLargeIds } from "./parseJsonWithLargeIds";

describe("API JSON with large IDs", () => {
  test("preserves exact message and user IDs in nested API responses", () => {
    expect(
      parseJsonWithLargeIds(
        '{"messages":[{"id":1234567890123456789,"sender_id":9876543210987654321,"user":{"user_id":9876543210987654321}}]}',
      ),
    ).toEqual({
      messages: [
        {
          id: "1234567890123456789",
          sender_id: "9876543210987654321",
          user: { user_id: "9876543210987654321" },
        },
      ],
    });
  });

  test("preserves profile comment targets while keeping ordinary item IDs numeric", () => {
    expect(
      parseJsonWithLargeIds(
        '{"items":[{"item_type":"user","item_id":1019539798383398912},{"item_type":"season","item_id":33}]}',
      ),
    ).toEqual({
      items: [
        { item_type: "user", item_id: "1019539798383398912" },
        { item_type: "season", item_id: 33 },
      ],
    });
  });

  test("preserving numeric IDs does not change quoted IDs or unrelated response data", () => {
    expect(
      parseJsonWithLargeIds(
        '{"id":"1234567890123456789","reply_to_id":null,"content":"ID 1234567890123456789","amount":12.5,"timestamp":1234567890123456}',
      ),
    ).toEqual({
      id: "1234567890123456789",
      reply_to_id: null,
      content: "ID 1234567890123456789",
      amount: 12.5,
      timestamp: 1234567890123456,
    });
  });
});
