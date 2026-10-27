import { expect, test } from "bun:test";
import { colorGroup, groupProblems, withDefaultColors } from "./themeColors";
import { MARKET_COLORS } from "@/utils/items/badgeColors";

test("unused role badge colors are removed while menu badge and supporter colors stay", () => {
  const vars = {
    "--color-badge-owner": "#8000ff",
    "--color-badge-premium-gold": "#ffbf00",
    "--color-menu-badge-text": "#ffffff",
    "--color-supporter-gold-border": "#ffd700",
  };
  const filled = withDefaultColors(vars);
  expect(filled).not.toHaveProperty("--color-badge-owner");
  expect(filled).not.toHaveProperty("--color-badge-premium-gold");
  expect(filled["--color-menu-badge-text"]).toBe("#ffffff");
  expect(filled["--color-supporter-gold-border"]).toBe("#ffd700");
  expect(vars["--color-badge-owner"]).toBe("#8000ff");
});

test("theme editor includes only market backgrounds, preserving custom colors", () => {
  const saved = {
    "--color-demand-high": "#abcdef",
    "--color-demand-high-text": "#abcdef",
  };
  const filled = withDefaultColors(saved);
  expect(saved["--color-demand-high-text"]).toBe("#abcdef");
  expect(filled["--color-demand-high"]).toBe("#abcdef");
  expect(Object.keys(filled)).toHaveLength(Object.keys(MARKET_COLORS).length);
  for (const [key, [background]] of Object.entries(MARKET_COLORS)) {
    if (key !== "demand-high")
      expect(filled[`--color-${key}`]).toBe(background);
    expect(filled).not.toHaveProperty(`--color-${key}-text`);
    expect(colorGroup(`--color-${key}`)).toBe(
      key.startsWith("demand-") ? "Demand" : "Trends",
    );
  }
});

test("problems group under the color most of them share", () => {
  const raised = "--color-tertiary-bg";
  const problems = [
    `${raised} is too different from --color-primary-bg.`,
    `--color-primary-text on ${raised} has 1.1:1 contrast, needs 4.5:1.`,
    `--color-card-headline on ${raised} has 1.1:1 contrast, needs 4.5:1.`,
    `--color-link on ${raised} has 2.9:1 contrast, needs 3:1.`,
    "--color-form-button-text on --color-form-button has 2:1 contrast, needs 3:1.",
    "A theme can't be a single color.",
  ];
  const groups = groupProblems(problems);
  expect(groups.map(([key, items]) => [key, items.length])).toEqual([
    [raised, 4],
    ["--color-form-button-text", 1],
    ["", 1],
  ]);
  expect(groups[0][1][1].keys).toEqual(["--color-primary-text", raised]);
});
