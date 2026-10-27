// Plain-language names for theme colors, shared by the custom theme editor
// and its preview so both call a color the same thing.
import { MARKET_COLORS } from "@/utils/items/badgeColors";
import { marketThemeVars } from "@/utils/ui/marketThemeVars";

/**
 * The colors most people change, in the order the editor shows them. Kept
 * at 12 so the editor's 2- and 3-wide grids fill every row.
 */
export const MAIN_COLORS: [key: string, name: string][] = [
  ["--color-primary-bg", "Page background"],
  ["--color-secondary-bg", "Cards"],
  ["--color-tertiary-bg", "Raised surfaces"],
  ["--color-border-card", "Card borders"],
  ["--color-primary-text", "Text"],
  ["--color-secondary-text", "Secondary text"],
  ["--color-button-info", "Buttons"],
  ["--color-form-button-text", "Button text"],
  ["--color-button-secondary", "Secondary buttons"],
  ["--color-form-input", "Input background"],
  ["--color-link", "Links"],
  ["--color-highlight", "Highlights"],
];

const MAIN_NAMES = new Map<string, string>([
  ...MAIN_COLORS,
  ["--color-button-danger-text", "Danger button text"],
  ["--color-button-success-text", "Success button text"],
  ["--color-icon-tile-bg", "Icon tile background"],
  ["--color-icon-tile", "Icon tile icon"],
  ["--color-menu-badge-bg", "Menu badge background"],
  ["--color-menu-badge-text", "Menu badge text"],
]);

/** "--color-card-tag-bg" → "Card tag bg", unless it has a plain name above. */
export function colorName(key: string): string {
  const main = MAIN_NAMES.get(key);
  if (main) return main;
  const name = key.replace(/^--color-/, "").replace(/-/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** The group a color sits under in the editor's "More colors". */
export function colorGroup(key: string): string {
  const name = key.replace(/^--color-/, "");
  if (name.startsWith("demand-")) return "Demand";
  if (name.startsWith("trend-")) return "Trends";
  if (name.startsWith("icon-tile") || name.startsWith("menu-badge"))
    return "Icons and menu badges";
  if (name.startsWith("supporter-")) return "Supporters";
  if (name.startsWith("button-") || name.startsWith("form-button"))
    return "Buttons";
  if (name.startsWith("form-")) return "Forms";
  if (name.startsWith("link")) return "Links";
  if (name.startsWith("card-")) return "Cards";
  if (name.startsWith("border-")) return "Borders";
  if (name.includes("overlay")) return "Overlays";
  if (name.endsWith("-text")) return "Text";
  if (name.endsWith("-bg")) return "Backgrounds";
  return "Status and accents";
}

/** The order of the groups in "More colors". */
export const COLOR_GROUPS = [
  "Backgrounds",
  "Text",
  "Borders",
  "Cards",
  "Links",
  "Buttons",
  "Forms",
  "Status and accents",
  "Demand",
  "Trends",
  "Icons and menu badges",
  "Supporters",
  "Overlays",
];

// Colors added after themes existed, so older themes may not have them.
// Each starts where globals.css starts it: from the theme's own colors.
const NEWER_COLORS: [
  key: string,
  from: (vars: Record<string, string>) => string | undefined,
][] = [
  ["--color-button-danger-text", (v) => v["--color-form-button-text"]],
  ["--color-button-success-text", (v) => v["--color-form-button-text"]],
  ["--color-icon-tile", (v) => v["--color-link"]],
  ["--color-menu-badge-text", (v) => v["--color-link"]],
  [
    "--color-icon-tile-bg",
    (v) =>
      v["--color-button-info"] &&
      `color-mix(in srgb, ${v["--color-button-info"]} 15%, transparent)`,
  ],
  [
    "--color-menu-badge-bg",
    (v) =>
      v["--color-button-info"] &&
      `color-mix(in srgb, ${v["--color-button-info"]} 20%, transparent)`,
  ],
];

/** The theme's colors, with the newer ones filled in if missing. */
export function withDefaultColors(
  vars: Record<string, string>,
): Record<string, string> {
  const filled = marketThemeVars(vars);
  for (const [key, [background]] of Object.entries(MARKET_COLORS)) {
    filled[`--color-${key}`] ??= background;
  }
  for (const [key, from] of NEWER_COLORS) {
    const value = key in vars ? undefined : from(vars);
    if (value) filled[key] = value;
  }
  return filled;
}

/** A color var named in text, such as an API message. */
export const COLOR_VAR = /--color-[a-z0-9-]+/g;

/**
 * The API's readability problems, grouped under the color most of them
 * name, so one bad color reads as one fix. Problems naming no color (such
 * as "a single color") group under "".
 */
export function groupProblems(problems: string[]) {
  const keysOf = problems.map((p) => [...new Set(p.match(COLOR_VAR) ?? [])]);
  const counts = new Map<string, number>();
  for (const key of keysOf.flat()) counts.set(key, (counts.get(key) ?? 0) + 1);
  const groups = new Map<string, { problem: string; keys: string[] }[]>();
  problems.forEach((problem, i) => {
    const top = keysOf[i].reduce(
      (best, key) => (counts.get(key)! > (counts.get(best) ?? 0) ? key : best),
      "",
    );
    groups.set(top, [...(groups.get(top) ?? []), { problem, keys: keysOf[i] }]);
  });
  return [...groups];
}
