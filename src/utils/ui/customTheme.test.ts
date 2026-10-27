import { expect, test } from "bun:test";
import { runInNewContext } from "node:vm";
import { CUSTOM_THEME_INIT_SCRIPT, parseShareCode } from "./customTheme";

const run = (saved: string | null) => {
  const props: Record<string, string> = {};
  const dataset: Record<string, string> = {};
  runInNewContext(CUSTOM_THEME_INIT_SCRIPT, {
    localStorage: { getItem: () => saved },
    document: {
      documentElement: {
        dataset,
        style: {
          setProperty: (key: string, value: string) => (props[key] = value),
        },
      },
    },
  });
  return { props, dataset };
};

test("the saved custom theme applies only its colors before hydration", () => {
  const { props, dataset } = run(
    JSON.stringify({
      share_code: "K7QM4XRP",
      label: "Mine",
      scheme: "light",
      vars: {
        "--color-primary-bg": "#fff",
        "--color-badge-owner": "#ff0000",
        "--color-demand-high": "#abcdef",
        "--color-trend-rising": "#000000",
        "--color-trend-rising-text": "#ff0000",
        "--header-height": "999px",
      },
      logo_filter: null,
    }),
  );
  expect(props).toEqual({
    "--color-primary-bg": "#fff",
    "--color-demand-high": "#abcdef",
    "--color-demand-high-text": "#000000",
    "--color-trend-rising": "#000000",
    "--color-trend-rising-text": "#ffffff",
    "--logo-filter": "none",
    "color-scheme": "light",
  });
  expect(dataset).toEqual({ scheme: "light", customTheme: "K7QM4XRP" });
});

test("no saved theme, or a broken one, changes nothing", () => {
  for (const saved of [null, "not json", "{}"]) {
    expect(run(saved)).toEqual({ props: {}, dataset: {} });
  }
});

test("a pasted code or share link gives the share code", () => {
  for (const input of [
    "8V8RN337",
    " 8v8rn337 ",
    "https://jailbreakchangelogs.com/?theme=8V8RN337",
    "http://localhost:5500/values?page=2&theme=8v8rn337",
    "http://localhost:5500/themes/shared/8V8RN337",
  ]) {
    expect(parseShareCode(input)).toBe("8V8RN337");
  }
  for (const input of [
    "",
    "8V8RN33",
    "8V8RN3370",
    "https://example.com/",
    "O0O0O0O0",
  ]) {
    expect(parseShareCode(input)).toBeNull();
  }
});
