import { expect, test } from "bun:test";
import {
  sanitizeThemes,
  themeInitScript,
  themesCss,
  toThemeOptions,
  type SiteTheme,
  type ThemeOption,
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
        "--color-d": "red /* old",
        "bad key": "red",
      },
      logo_filter: "hue-rotate(100deg)",
      cursor_url: '/x.svg")}body{display:none',
      cursor_size: 24,
    }),
    theme({ slug: "Bad Slug" }),
    theme({ slug: "8bit" }),
  ]);
  expect(rest).toEqual([]);
  expect(safe.vars).toEqual({
    "--color-primary-bg": "#0f5a5e",
    "--color-link": "color-mix(in srgb, #8839ef 85%, black)",
  });
  expect(safe.cursor_url).toBeNull();
  expect(themesCss([safe])).toBe(
    ":root.future-tone{color-scheme:dark;--color-primary-bg:#0f5a5e;--color-link:color-mix(in srgb, #8839ef 85%, black);--logo-filter:hue-rotate(100deg);}" +
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

test("the init script can't be closed early by a theme name", () => {
  const evil = "</script><script>alert(1)</script>";
  const script = themeInitScript(
    [{ value: evil, scheme: "dark" } as ThemeOption],
    evil,
  );
  expect(script).not.toContain("<");
  const classes: string[] = [];
  new Function("localStorage", "document", script)(
    { getItem: () => null },
    {
      documentElement: {
        dataset: {},
        classList: { add: (c: string) => classes.push(c) },
      },
    },
  );
  expect(classes).toEqual([evil]);
});
