import { expect, test } from "bun:test";
import {
  sanitizeThemes,
  themesCss,
  toThemeOptions,
  type SiteTheme,
} from "./themeOptions";

const theme = (overrides: Partial<SiteTheme>): SiteTheme => ({
  slug: "future-tone",
  label: "Future Tone",
  icon: "lucide:disc-3",
  scheme: "dark",
  vars: {},
  logo_filter: null,
  cursor_url: null,
  cursor_size: null,
  is_default: false,
  ...overrides,
});

test("theme CSS keeps safe values and drops anything that could escape the style tag", () => {
  const [safe, ...rest] = sanitizeThemes([
    theme({
      vars: {
        "--color-primary-bg": "#0f5a5e",
        "--color-link": "color-mix(in srgb, #8839ef 85%, black)",
        "--color-a": "red}</style><script>alert(1)</script>",
        "--color-b": "url(https://evil.example)",
        "--color-c": "red;\n--x: y",
        "bad key": "red",
      },
      logo_filter: "hue-rotate(100deg)",
      cursor_url: '/x.svg")}body{display:none',
      cursor_size: 24,
    }),
    theme({ slug: "Bad Slug" }),
  ]);
  expect(rest).toEqual([]);
  expect(safe.vars).toEqual({
    "--color-primary-bg": "#0f5a5e",
    "--color-link": "color-mix(in srgb, #8839ef 85%, black)",
  });
  expect(safe.cursor_url).toBeNull();
  expect(themesCss([safe])).toBe(
    ":root.future-tone{color-scheme:dark;--color-primary-bg:#0f5a5e;--color-link:color-mix(in srgb, #8839ef 85%, black);}" +
      ":root.future-tone .header-logo{filter:hue-rotate(100deg)}" +
      ":root.future-tone .theme-cursor-icon{width:24px;height:24px}",
  );
});

test("previews resolve var() links against the theme's own vars", () => {
  const [option] = toThemeOptions([
    theme({
      scheme: "light",
      vars: {
        "--color-highlight": "#8839ef",
        "--color-link": "var(--color-highlight)",
      },
    }),
  ]);
  expect(option.scheme).toBe("light");
  expect(option.preview.link).toBe("#8839ef");
});
