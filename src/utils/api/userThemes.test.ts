import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  checkMyTheme,
  createMyTheme,
  updateMyTheme,
  fetchMarketplaceThemes,
  reportMarketplaceTheme,
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

test("marketplace requests paginate, sort, search safely, and sanitize previews", async () => {
  const urls: URL[] = [];
  globalThis.fetch = (async (url: string) => {
    urls.push(new URL(url));
    return Response.json({
      items: [
        {
          ...theme,
          share_code: "ABCDEFGH",
          published_at: 123,
          user: { id: "1" },
          vars: { ...theme.vars, "--color-link": "url(https://evil.example)" },
        },
      ],
      total: 25,
      page: 2,
      total_pages: 2,
      size: 24,
    });
  }) as unknown as typeof fetch;
  const result = await fetchMarketplaceThemes(2, "oldest");
  expect(urls[0].pathname).toBe("/v2/themes/marketplace");
  expect(urls[0].searchParams.get("page")).toBe("2");
  expect(urls[0].searchParams.get("sort")).toBe("oldest");
  expect(result.items[0].vars).toEqual(theme.vars);
  expect(result.items[0].published_at).toBe(123);
  expect(result.total_pages).toBe(2);
  await fetchMarketplaceThemes(1, "newest", "  Moon & stars  ");
  expect(urls[1].pathname).toBe("/v2/themes/marketplace/search");
  expect(urls[1].searchParams.get("query")).toBe("Moon & stars");
  await fetchMarketplaceThemes(1, "newest", "   ");
  expect(urls[2].pathname).toBe("/v2/themes/marketplace");
  await fetchMarketplaceThemes(1, "newest", "id:ABCDEFGH");
  expect(urls[3].searchParams.get("query")).toBe("id:ABCDEFGH");
});

test("publishing and unpublishing send the flag without replacing colors", async () => {
  const bodies: unknown[] = [];
  globalThis.fetch = (async (_url: string, options?: RequestInit) => {
    const body = JSON.parse(options?.body as string);
    bodies.push(body);
    return Response.json({
      ...theme,
      share_code: "ABCDEFGH",
      id: 1,
      published_at: body.published ? 123 : null,
    });
  }) as unknown as typeof fetch;
  expect((await updateMyTheme(1, { published: true })).published_at).toBe(123);
  expect(
    (await updateMyTheme(1, { published: false })).published_at,
  ).toBeNull();
  await createMyTheme({ ...theme, published: true });
  expect(bodies).toEqual([
    { published: true },
    { published: false },
    { ...theme, published: true },
  ]);
});

test("reports send a trimmed reason and preserve API error codes", async () => {
  let request: { url: string; options?: RequestInit } | undefined;
  globalThis.fetch = (async (url: string, options?: RequestInit) => {
    request = { url: String(url), options };
    return Response.json(
      { error: "report_exists", message: "Already reported." },
      { status: 400 },
    );
  }) as unknown as typeof fetch;
  const error = await reportMarketplaceTheme(
    "ABCDEFGH",
    "  Offensive name  ",
  ).catch((e) => e);
  expect(request?.url).toEndWith("/v2/themes/marketplace/ABCDEFGH/reports");
  expect(request?.options?.method).toBe("POST");
  expect(JSON.parse(request?.options?.body as string)).toEqual({
    reason: "Offensive name",
  });
  expect(error).toBeInstanceOf(ThemeApiError);
  expect(error.code).toBe("report_exists");
});

test("a rejected public name preserves the filter error for display", async () => {
  globalThis.fetch = (async () =>
    Response.json(
      { error: "profanity", message: "Please choose a different name." },
      { status: 400 },
    )) as unknown as typeof fetch;
  const error = await updateMyTheme(1, { published: true }).catch((e) => e);
  expect(error).toBeInstanceOf(ThemeApiError);
  expect(error.code).toBe("profanity");
  expect(error.message).toBe("Please choose a different name.");
});
