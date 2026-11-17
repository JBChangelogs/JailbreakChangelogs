import { expect, test } from "bun:test";
import { safeEmbedUrl, siteLinksIn, splitSiteLinks } from "./siteLinks";

test("detects site links, keeps message text, deduplicates and caps previews", () => {
  const text =
    "See jailbreakchangelogs.com. https://app.jailbreakchangelogs.com/trades?x=1#top";
  expect(siteLinksIn(text)).toEqual([
    "https://jailbreakchangelogs.com",
    "https://app.jailbreakchangelogs.com/trades?x=1#top",
  ]);
  expect(
    splitSiteLinks(text)
      .map((part) => (typeof part === "string" ? part : part.text))
      .join(""),
  ).toBe(text);
  expect(
    siteLinksIn("jailbreakchangelogs.com jailbreakchangelogs.com"),
  ).toHaveLength(1);
  expect(
    siteLinksIn(
      [1, 2, 3, 4]
        .map((id) => `https://jailbreakchangelogs.com/users/${id}`)
        .join(" "),
    ),
  ).toHaveLength(3);
});

test("rejects lookalike hosts and unsafe embed URLs", () => {
  for (const text of [
    "jailbreakchangelogs.com.evil.com",
    "evil.com/jailbreakchangelogs.com",
    "jailbreakchangelogs.com@evil.com",
    "eviljailbreakchangelogs.com",
  ]) {
    expect(siteLinksIn(text)).toEqual([]);
  }
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "//example.com/image",
    "http://example.com/image",
    null,
  ]) {
    expect(safeEmbedUrl(url)).toBeNull();
  }
  expect(
    safeEmbedUrl("https://embeds.jailbreakchangelogs.com/og/values.png"),
  ).toBe("https://embeds.jailbreakchangelogs.com/og/values.png");
});
