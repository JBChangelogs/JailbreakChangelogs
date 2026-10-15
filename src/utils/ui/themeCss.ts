import { safeValue } from "@/utils/ui/themeOptions";
import type { CustomThemeInput } from "@/utils/api/userThemes";

type ThemeCss = Pick<CustomThemeInput, "scheme" | "vars" | "logo_filter">;

/** A theme as a :root block, for copying or editing by hand. */
export function themeToCss({ scheme, vars, logo_filter }: ThemeCss): string {
  const lines = [
    `  color-scheme: ${scheme};`,
    `  --logo-filter: ${logo_filter || "none"};`,
    ...Object.entries(vars).map(([key, value]) => `  ${key}: ${value};`),
  ];
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/**
 * Reads hand-edited CSS back into a theme. Only declarations the theme has
 * count: color-scheme, --logo-filter and the given color keys. Anything
 * else, or an unsafe value, is skipped and listed in `errors`.
 */
export function parseThemeCss(
  css: string,
  colorKeys: string[],
): { theme: Partial<ThemeCss>; errors: string[] } {
  const known = new Set(colorKeys);
  const vars: Record<string, string> = {};
  const theme: Partial<ThemeCss> = {};
  const errors: string[] = [];

  // Comments aside, a declaration is "name: value" up to ";", "}" or a line end.
  const body = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const match of body.matchAll(/([a-z-]+)\s*:\s*([^;{}\n]+)/gi)) {
    const name = match[1].toLowerCase();
    const value = match[2].trim();
    if (name === "color-scheme") {
      if (value === "dark" || value === "light") theme.scheme = value;
      else errors.push(`color-scheme must be "dark" or "light".`);
    } else if (!safeValue(value)) {
      errors.push(`${name}: this value isn't allowed.`);
    } else if (name === "--logo-filter") {
      theme.logo_filter = value === "none" ? null : value;
    } else if (known.has(name)) {
      vars[name] = value;
    } else {
      errors.push(`${name} isn't a theme color.`);
    }
  }
  if (Object.keys(vars).length) theme.vars = vars;
  return { theme, errors };
}
