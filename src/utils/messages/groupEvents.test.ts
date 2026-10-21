import { expect, test } from "bun:test";
import {
  describeGroupEvent,
  groupEventUserIds,
  parseGroupEvent,
  type EventPart,
} from "./groupEvents";

const names: Record<string, string> = {
  "1": "Alex",
  "2": "Sam",
  "3": "Kim",
  "4": "Lee",
};
const text = (parts: EventPart[]) =>
  parts.map((part) => (typeof part === "string" ? part : part.strong)).join("");
const line = (metadata: Record<string, unknown>, senderId = "1") => {
  const event = parseGroupEvent(metadata)!;
  return text(describeGroupEvent(event, senderId, (id) => names[id]));
};

test("each group event reads as a sentence", () => {
  expect(
    line({ type: "group_renamed", old_name: "Old", new_name: "Crew" }),
  ).toBe("Alex changed the group name: Crew");
  expect(line({ type: "members_added", user_ids: ["2"] })).toBe(
    "Alex added Sam to the group.",
  );
  expect(line({ type: "members_added", user_ids: ["2", "3", "4"] })).toBe(
    "Alex added Sam, Kim and Lee to the group.",
  );
  expect(line({ type: "member_removed", user_id: "2" })).toBe(
    "Alex removed Sam from the group.",
  );
  expect(line({ type: "member_left", user_id: "2" }, "2")).toBe(
    "Sam left the group.",
  );
  expect(
    line({ type: "member_left", user_id: "1", new_owner_id: "3" }, "1"),
  ).toBe("Alex left the group. Kim is now the owner.");
});

test("other metadata isn't a group event, and events name who to load", () => {
  expect(parseGroupEvent({ type: "game_invite", place_id: "1" })).toBeNull();
  expect(parseGroupEvent(null)).toBeNull();
  expect(parseGroupEvent({ type: "member_removed" })).toBeNull();
  expect(
    groupEventUserIds(
      parseGroupEvent({ type: "member_left", user_id: 5, new_owner_id: 6 })!,
    ),
  ).toEqual(["5", "6"]);
});
