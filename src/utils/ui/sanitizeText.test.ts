import { expect, test } from "bun:test";
import { sanitizeText } from "./sanitizeText";

test("text cleanup preserves emoji sequences, including selectors and keycaps", () => {
  for (const text of [
    "❤️",
    "👩🏽‍💻",
    "1️⃣",
    "#️⃣",
    "🔟",
    "🇺🇸",
    "🅰️",
    "Ⓜ️",
    "ℹ️",
    "🆗",
    "🖕 🍆 🍑 💦",
    "🇫🇺🇨🇰 Ⓕⓤⓒⓚ 🅵🆄🅲🅺 ＦＵＣＫ",
  ]) {
    expect(sanitizeText(text)).toBe(text);
  }
  expect(sanitizeText("a\u0301\uFE0F\u0308\u20E3\u0301")).toBe("a\uFE0F\u20E3");
  expect(sanitizeText("h\u0301\u0308ello")).toBe("hello");
});
