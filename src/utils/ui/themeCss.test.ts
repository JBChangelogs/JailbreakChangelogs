import { expect, test } from "bun:test";
import { parseThemeCss, themeToCss } from "./themeCss";

const theme = {
  scheme: "dark" as const,
  vars: {
    "--color-primary-bg": "#121317",
    "--color-link": "color-mix(in srgb, #8839ef 85%, black)",
  },
  logo_filter: "hue-rotate(45deg)",
};
const keys = Object.keys(theme.vars);

test("a theme's CSS reads back as the same theme", () => {
  expect(parseThemeCss(themeToCss(theme), keys)).toEqual({
    theme,
    errors: [],
  });
  expect(
    parseThemeCss(themeToCss({ ...theme, logo_filter: null }), keys).theme
      .logo_filter,
  ).toBeNull();
});

test("pasted CSS keeps theme colors and lists everything it skipped", () => {
  const { theme: parsed, errors } = parseThemeCss(
    `/* mine */ :root {
      color-scheme: light;
      --color-primary-bg: #fff;
      --color-link: url(https://evil.example);
      --header-height: 999px;
      color-scheme: purple;
    }`,
    keys,
  );
  expect(parsed).toEqual({
    scheme: "light",
    vars: { "--color-primary-bg": "#fff" },
  });
  expect(errors).toEqual([
    "--color-link: this value isn't allowed.",
    "--header-height isn't a theme color.",
    'color-scheme must be "dark" or "light".',
  ]);
});
