import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import SeasonXpBar from "./SeasonXpBar";
import XpProgressBar from "@/components/Inventory/XpProgressBar";

test("shared XP bar keeps fill and contrasting label clipping aligned", () => {
  for (const percent of [0, 50, 100]) {
    const html = renderToStaticMarkup(
      <SeasonXpBar percent={percent} xpLabel="250/500" level={3} season={30} />,
    );
    expect(html).toContain(`width:${percent}%`);
    expect(html).toContain(`clip-path:inset(0 ${100 - percent}% 0 0)`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("overflow-hidden rounded-lg");
    expect(html).toContain("250/500");
    expect(html).toContain("LEVEL 3");
    expect(html).toContain("SEASON 30");
  }
});

test("shared XP bar accepts mobile XP text and the caller's background", () => {
  const html = renderToStaticMarkup(
    <SeasonXpBar
      percent={50}
      xpLabel="250/500"
      level={3}
      season={30}
      mobileSecondaryText="250/500 XP"
      bgStyle="tertiary"
    />,
  );
  expect(html).toContain("250/500 XP");
  expect(html).toContain("bg-tertiary-bg");
});

test("inventory XP wrapper preserves missing-season and rate-limit behavior", () => {
  const props = { currentLevel: 1, currentXp: 0, season: null };
  expect(renderToStaticMarkup(<XpProgressBar {...props} />)).toBe("");
  expect(
    renderToStaticMarkup(
      <XpProgressBar {...props} seasonRateLimitMessage="Try again later" />,
    ),
  ).toContain("Try again later");
});
