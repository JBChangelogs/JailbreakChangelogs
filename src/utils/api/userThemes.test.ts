import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  checkMyTheme,
  createMyTheme,
  updateMyTheme,
  ThemeApiError,
} from "./userThemes";

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;
// CI has no .env, so the API URL is set here rather than inherited.
beforeEach(() => {
  process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
});

const theme = {
  label: "Mine",
  scheme: "dark" as const,
  vars: { "--color-primary-bg": "#000" },
  logo_filter: null,
};

test("save and validation requests send market backgrounds without derived text variables", async () => {
  const bodies: { vars: Record<string, string> }[] = [];
  globalThis.fetch = (async (_url: string, options?: RequestInit) => {
    const body = JSON.parse(options?.body as string);
    bodies.push(body);
    return Response.json({ ...body, share_code: "K7QM4XRP", id: 1 });
  }) as unknown as typeof fetch;
  const input = {
    ...theme,
    vars: {
      ...theme.vars,
      "--color-demand-high": "#ff0000",
      "--color-demand-high-text": "#ff0000",
      "--color-badge-owner": "#ff0000",
    },
  };
  await createMyTheme(input);
  await updateMyTheme(1, input);
  await checkMyTheme(input);
  expect(bodies).toHaveLength(3);
  for (const body of bodies) {
    expect(body.vars).toEqual({
      ...theme.vars,
      "--color-demand-high": "#ff0000",
    });
  }
});

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
