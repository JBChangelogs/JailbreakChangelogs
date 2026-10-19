import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ItemUnlockBadges } from "./ItemUnlockBadges";

test("unlock overlays match item cards and omit missing fields", () => {
  const both = renderToStaticMarkup(
    <ItemUnlockBadges season={12} level={10} />,
  );
  expect(both).toContain("S12");
  expect(both).toContain("L10");
  expect(both).toContain("right-2 bottom-2");
  expect(both).toContain("bg-button-info");
  expect(both).toContain("bg-status-success");
  expect(both).not.toContain("href=");
  const levelOnly = renderToStaticMarkup(<ItemUnlockBadges level={10} />);
  expect(levelOnly).toContain("L10");
  expect(levelOnly).not.toContain("bg-button-info");
  expect(renderToStaticMarkup(<ItemUnlockBadges season={12} />)).not.toContain(
    "bg-status-success",
  );
  expect(renderToStaticMarkup(<ItemUnlockBadges level="2%" />)).toContain("2%");
  expect(
    renderToStaticMarkup(<ItemUnlockBadges season={null} level={null} />),
  ).toBe("");
});

test("item detail badges link to the season only when both fields are present", () => {
  for (const level of [10, "10", "2%", 0]) {
    const markup = renderToStaticMarkup(
      <ItemUnlockBadges season={14} level={level} linkToSeason className="" />,
    );
    expect(markup).toContain('href="/seasons/14"');
    expect(markup).toContain('aria-label="View Season 14"');
    expect(markup).not.toContain("absolute");
    expect(markup).not.toContain("cursor-help");
  }

  for (const props of [
    { season: 14 },
    { level: 10 },
    { season: 14, level: null },
    { season: 14, level: "" },
    { season: null, level: 10 },
  ]) {
    const markup = renderToStaticMarkup(
      <ItemUnlockBadges {...props} linkToSeason className="" />,
    );
    expect(markup).not.toContain("href=");
    expect(markup).toContain("cursor-help");
  }
});
