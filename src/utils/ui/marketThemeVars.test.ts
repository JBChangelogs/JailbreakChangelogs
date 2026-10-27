import { expect, test } from "bun:test";
import { readableTextColor } from "./accentColor";
import { marketThemeVars } from "./marketThemeVars";
import { sanitizeCustomTheme, type CustomTheme } from "@/utils/api/userThemes";

test("badge text is automatic black or white and cannot be overridden by saved text", () => {
  for (const [background, text] of [
    ["#ffffff", "#000000"],
    ["#000000", "#ffffff"],
    ["#ff0000", "#000000"],
    ["#4cdcfc", "#000000"],
  ]) {
    for (const group of ["demand-high", "trend-rising"]) {
      const key = `--color-${group}`;
      const vars = { [key]: background, [`${key}-text`]: background };
      expect(marketThemeVars(vars, readableTextColor)).toEqual({
        [key]: background,
        [`${key}-text`]: text,
      });
      expect(marketThemeVars(vars)).toEqual({ [key]: background });
      expect(vars[`${key}-text`]).toBe(background);
    }
  }
});

test("theme sanitization keeps market backgrounds and removes editable market text", () => {
  expect(
    sanitizeCustomTheme<CustomTheme>({
      share_code: "K7QM4XRP",
      label: "Mine",
      scheme: "dark",
      logo_filter: null,
      vars: {
        "--color-demand-high": "#ff0000",
        "--color-demand-high-text": "#ff0000",
        "--color-trend-rising": "#000000",
        "--color-trend-rising-text": "#000000",
        "--color-primary-text": "#ffffff",
      },
    }).vars,
  ).toEqual({
    "--color-demand-high": "#ff0000",
    "--color-trend-rising": "#000000",
    "--color-primary-text": "#ffffff",
  });
});

test("market colors can reference another theme color without saving derived text", () => {
  const vars = {
    "--color-link": "#ffffff",
    "--color-demand-high": "var(--color-link)",
  };
  expect(
    marketThemeVars(vars, readableTextColor)["--color-demand-high-text"],
  ).toBe("#000000");
  expect(marketThemeVars(vars)).toEqual(vars);
});
