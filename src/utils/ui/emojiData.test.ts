import { expect, test } from "bun:test";
import type { Emoji, ShortcodesDataset } from "emojibase";
import data from "emojibase-data/en/data.json";
import codes from "emojibase-data/en/shortcodes/joypixels.json";
import { buildEmojiData, searchEmojis, withSkinTone } from "./emojiData";

const emoji = buildEmojiData(data as Emoji[], codes as ShortcodesDataset, 15);

test("groups, caps the emoji version, searches by shortcode and applies skin tones", () => {
  expect(emoji.groups.map((g) => g.key)).toEqual([
    "smileys",
    "people",
    "nature",
    "food",
    "travel",
    "activities",
    "objects",
    "symbols",
    "flags",
  ]);
  expect(emoji.groups[0].emojis[0].emoji).toBe("😀");
  expect(emoji.byEmoji.has("🫩")).toBe(false);
  expect(searchEmojis(emoji, ":joy:")[0].emoji).toBe("😂");
  expect(searchEmojis(emoji, "  ")).toEqual([]);
  const wave = emoji.byEmoji.get("👋")!;
  expect(emoji.byEmoji.get("👋🏽")).toBe(wave);
  expect(withSkinTone(wave, 3)).toBe("👋🏽");
  expect(withSkinTone(wave, 0)).toBe("👋");
  expect(withSkinTone(emoji.byEmoji.get("😂")!, 3)).toBe("😂");
});
