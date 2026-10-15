// Plain-language names for theme colors, shared by the custom theme editor
// and its preview so both call a color the same thing.

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
  if (name.startsWith("badge-")) return "Badges";
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
  "Badges",
  "Supporters",
  "Overlays",
];

// Added after themes existed, so older themes may not have them. They start
// as the theme's button text, as they do in globals.css.
const BUTTON_TEXT_COLORS = [
  "--color-button-danger-text",
  "--color-button-success-text",
];

/** The theme's colors, with the newer button text colors filled in if missing. */
export function withButtonTextColors(
  vars: Record<string, string>,
): Record<string, string> {
  const text = vars["--color-form-button-text"];
  if (!text) return vars;
  const missing = BUTTON_TEXT_COLORS.filter((key) => !(key in vars));
  return missing.length
    ? { ...vars, ...Object.fromEntries(missing.map((key) => [key, text])) }
    : vars;
}
