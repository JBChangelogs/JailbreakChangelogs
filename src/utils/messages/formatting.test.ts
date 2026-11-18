import { expect, test } from "bun:test";
import { isJumboEmoji } from "./formatting";

test("only emoji-only messages of up to 27 emoji are jumbo", () => {
  expect(isJumboEmoji("🖕")).toBe(true);
  expect(isJumboEmoji("👍🏽 🇮🇸 👨‍👩‍👧")).toBe(true);
  expect(isJumboEmoji("🖕".repeat(27))).toBe(true);
  expect(isJumboEmoji("🖕".repeat(28))).toBe(false);
  expect(isJumboEmoji("hi 🖕")).toBe(false);
  expect(isJumboEmoji("123")).toBe(false);
  expect(isJumboEmoji("")).toBe(false);
});
