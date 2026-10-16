import { afterEach, expect, test } from "bun:test";
import { checkMyTheme, createMyTheme, ThemeApiError } from "./userThemes";

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

const theme = {
  label: "Mine",
  scheme: "dark" as const,
  vars: { "--color-primary-bg": "#000" },
  logo_filter: null,
};

test("an unreadable save carries every problem", async () => {
  const problems = ["A on B has 2.8:1 contrast, needs 4.5:1.", "C is missing."];
  globalThis.fetch = (async () =>
    Response.json(
      { error: "theme_unreadable", message: problems[0], problems },
      { status: 400 },
    )) as unknown as typeof fetch;
  const err = await createMyTheme(theme).catch((e) => e);
  expect(err).toBeInstanceOf(ThemeApiError);
  expect(err.code).toBe("theme_unreadable");
  expect(err.problems).toEqual(problems);
});

test("check posts the scheme and colors to the check endpoint", async () => {
  let request: { url: string; options?: RequestInit } | undefined;
  globalThis.fetch = (async (url: string, options?: RequestInit) => {
    request = { url: String(url), options };
    return Response.json({ valid: true, problems: [] });
  }) as unknown as typeof fetch;
  const body = { scheme: theme.scheme, vars: theme.vars };
  expect(await checkMyTheme(body)).toEqual({
    valid: true,
    problems: [],
    fixes: {},
  });
  expect(request?.url).toEndWith("/v2/users/me/themes/check");
  expect(request?.options?.method).toBe("POST");
  expect(JSON.parse(request?.options?.body as string)).toEqual(body);
});

test("check keeps only safe suggested fixes", async () => {
  globalThis.fetch = (async () =>
    Response.json({
      valid: false,
      problems: [
        "--color-tertiary-bg is too different from --color-primary-bg.",
      ],
      fixes: {
        "--color-tertiary-bg": "#2b2f36",
        "--color-link": "url(https://evil.example/x)",
        "not-a-var": "#fff",
      },
    })) as unknown as typeof fetch;
  const { fixes } = await checkMyTheme({ scheme: "dark", vars: {} });
  expect(fixes).toEqual({ "--color-tertiary-bg": "#2b2f36" });
});
