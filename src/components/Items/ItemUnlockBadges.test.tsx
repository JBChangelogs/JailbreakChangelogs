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
