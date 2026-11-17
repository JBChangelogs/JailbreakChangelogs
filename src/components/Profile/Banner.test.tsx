import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Banner, getProfileBanner } from "./Banner";

test("banners use the resolved API URL unchanged, including animated Discord banners", () => {
  for (const bannerUrl of [
    "https://cdn.discordapp.com/banners/123/a_animated.gif",
    "https://uploads.jailbreakchangelogs.com/banners/custom.webp",
  ]) {
    expect(getProfileBanner({ userId: "123", bannerUrl }).primary).toBe(
      bannerUrl,
    );
    const html = renderToStaticMarkup(
      <Banner userId="123" username="Test" bannerUrl={bannerUrl} />,
    );
    expect(
      html.includes(bannerUrl) || html.includes(encodeURIComponent(bannerUrl)),
    ).toBe(true);
    expect(html).not.toContain("?size=");
  }
});

test("null banners keep a decorative background without identifying it as a user banner", () => {
  const { primary, fallback } = getProfileBanner({
    userId: "123",
    bannerUrl: null,
  });
  expect(primary).toBeNull();
  const html = renderToStaticMarkup(
    <Banner userId="123" username="Test" bannerUrl={null} expandable />,
  );
  expect(
    html.includes(fallback) || html.includes(encodeURIComponent(fallback)),
  ).toBe(true);
  expect(html).not.toContain("cursor-zoom-in");
});
