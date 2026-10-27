import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  MARKET_COLORS,
  getDemandColor,
  getDemandCssColor,
  getTrendColor,
  getTrendCssColor,
} from "./badgeColors";

test("every market badge and indicator uses its theme color", () => {
  const css = readFileSync(
    new URL("../../app/globals.css", import.meta.url),
    "utf8",
  );
  for (const [key, [background, text]] of Object.entries(MARKET_COLORS)) {
    const demand = key.startsWith("demand-");
    const label = key.replace(/^(demand|trend)-/, "").replaceAll("-", " ");
    expect((demand ? getDemandColor : getTrendColor)(label.toUpperCase())).toBe(
      `bg-${key} text-${key}-text`,
    );
    expect((demand ? getDemandCssColor : getTrendCssColor)(label)).toBe(
      `var(--color-${key})`,
    );
    expect(css).toContain(`--color-${key}: ${background};`);
    expect(css).toContain(`--color-${key}-text: ${text};`);
  }
});

test("missing and unrecognized market values use the unknown palette", () => {
  for (const value of [
    null,
    undefined,
    "",
    "N/A",
    "null",
    "other",
    "constructor",
    "__proto__",
  ]) {
    expect(getDemandColor(value)).toBe(
      "bg-demand-unknown text-demand-unknown-text",
    );
    expect(getDemandCssColor(value)).toBe("var(--color-demand-unknown)");
    expect(getTrendColor(value)).toBe(
      "bg-trend-unknown text-trend-unknown-text",
    );
    expect(getTrendCssColor(value)).toBe("var(--color-trend-unknown)");
  }
});
