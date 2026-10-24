import { expect, test } from "bun:test";
import {
  MENTION_SPLIT,
  mentionsToIds,
  mentionsToText,
  splitDraftMentions,
} from "./mentions";
import { toggleReaction } from "./reactions";
import type { MessageUser } from "./types";

const bob = { id: "123", username: "bob", avatar: "" } as MessageUser;
const bobby = { id: "456", username: "bobby", avatar: "" } as MessageUser;

test("mentions round-trip between @username and <@id>", () => {
  expect(mentionsToIds("hi @Bob, mail email@bob or @bobby", [bob])).toBe(
    "hi <@123>, mail email@bob or @bobby",
  );
  expect(mentionsToIds("@bobby and @bob.", [bob, bobby])).toBe(
    "<@456> and @bob.",
  );
  const names = new Map([["123", "bob"]]);
  expect(mentionsToText("<@123> <@999>", (id) => names.get(id))).toBe(
    "@bob @unknown-user",
  );
  expect("a <@123> b".split(MENTION_SPLIT)).toEqual(["a ", "123", " b"]);
  expect(splitDraftMentions("hey @bob x@bob", [bob])).toEqual([
    "hey ",
    "@bob",
    " x@bob",
  ]);
});

test("toggling a reaction adds, removes, and drops emptied emoji", () => {
  const added = toggleReaction({ "👍": ["1"] }, "👍", "2");
  expect(added).toEqual({ "👍": ["1", "2"] });
  expect(toggleReaction(added, "👍", "2")).toEqual({ "👍": ["1"] });
  expect(toggleReaction({ "👍": ["1"] }, "👍", "1")).toEqual({});
  expect(toggleReaction(undefined, "❤️", "1")).toEqual({ "❤️": ["1"] });
});
