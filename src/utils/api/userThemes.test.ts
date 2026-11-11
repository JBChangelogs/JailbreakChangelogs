import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  checkMyTheme,
  copyLabel,
  createMyTheme,
  updateMyTheme,
  fetchMarketplaceThemes,
  reportMarketplaceTheme,
  uploadThemePreview,
  deleteThemePreview,
  sanitizeThemePreviews,
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

const screenshot = {
  id: "abc123",
  url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/abc123.webp",
  kind: "desktop" as const,
};

test("preview upload uses multipart image data without a JSON content type, and delete returns the new list", async () => {
  const requests: { url: string; options?: RequestInit }[] = [];
  globalThis.fetch = (async (url: string, options?: RequestInit) => {
    requests.push({ url: String(url), options });
    return Response.json({
      previews: options?.method === "POST" ? [screenshot] : [],
    });
  }) as unknown as typeof fetch;
  const file = new File(["screenshot"], "desktop.png", { type: "image/png" });
  expect(await uploadThemePreview(1, file)).toEqual([screenshot]);
  expect(requests[0].url).toEndWith("/v2/users/me/themes/1/previews");
  expect(requests[0].options?.method).toBe("POST");
  const body = requests[0].options?.body as FormData;
  expect(body).toBeInstanceOf(FormData);
  expect((body.get("image") as File).name).toBe("desktop.png");
  expect((body.get("image") as File).size).toBe(file.size);
  expect(new Headers(requests[0].options?.headers).has("Content-Type")).toBe(
    false,
  );
  expect(requests[0].options?.credentials).toBe("include");
  expect(await deleteThemePreview(1, "abc/123")).toEqual([]);
  expect(requests[1].url).toEndWith("/v2/users/me/themes/1/previews/abc%2F123");
  expect(requests[1].options?.method).toBe("DELETE");
});

test("preview data keeps only upload-host screenshots and valid desktop/mobile kinds", () => {
  expect(
    sanitizeThemePreviews([
      screenshot,
      { ...screenshot, kind: "mobile" },
      { ...screenshot, url: "javascript:alert(1)" },
      { ...screenshot, url: "https://evil.example/image.png" },
      {
        ...screenshot,
        url: "https://uploads.jailbreakchangelogs.com/other/image.webp",
      },
      { ...screenshot, kind: "unknown" },
      null,
    ]),
  ).toEqual([screenshot, { ...screenshot, kind: "mobile" }]);
  expect(
    sanitizeThemePreviews([screenshot, screenshot, screenshot, screenshot]),
  ).toHaveLength(3);
});

test("preview API errors retain moderation and retry codes", async () => {
  for (const [code, status] of [
    ["upload_failed", 400],
    ["image_rejected", 400],
    ["preview_limit_reached", 400],
    ["review_unavailable", 503],
    ["supporter_required", 403],
  ] as const) {
    globalThis.fetch = (async () =>
      Response.json({ error: code }, { status })) as unknown as typeof fetch;
    const error = await uploadThemePreview(
      1,
      new File(["test"], "test.png"),
    ).catch((e) => e);
    expect(error).toBeInstanceOf(ThemeApiError);
    expect(error.code).toBe(code);
    expect(error.status).toBe(status);
  }
});

test("create and patch preserve descriptions, including both clear values", async () => {
  const inputs: unknown[] = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const input = JSON.parse(String(init?.body));
    inputs.push(input);
    return Response.json({ ...theme, ...input, id: 1, share_code: "ABCDEFGH" });
  }) as unknown as typeof fetch;
  expect(
    (await createMyTheme({ ...theme, description: "Soft accents" }))
      .description,
  ).toBe("Soft accents");
  await updateMyTheme(1, { description: "" });
  await updateMyTheme(1, { description: null });
  expect(inputs).toEqual([
    { ...theme, description: "Soft accents" },
    { description: "" },
    { description: null },
  ]);
});

test("description word-filter errors retain the backend message", async () => {
  const message = "Please choose a different description.";
  globalThis.fetch = (async () =>
    Response.json(
      { error: "profanity", message },
      { status: 400 },
    )) as unknown as typeof fetch;
  const error = await updateMyTheme(1, {
    description: "Rejected text",
    published: true,
  }).catch((error) => error);
  expect(error).toBeInstanceOf(ThemeApiError);
  expect(error.message).toBe(message);
});

test("marketplace fetches pass cancellation signals through to the API", async () => {
  const signal = new AbortController().signal;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    expect(init?.signal).toBe(signal);
    return Response.json({
      items: [],
      total: 0,
      page: 1,
      total_pages: 0,
      size: 24,
    });
  }) as unknown as typeof fetch;
  await fetchMarketplaceThemes(1, "newest", "", signal);
});

test("copies get the first free #n name", () => {
  expect(copyLabel("Fall", [])).toBe("Fall");
  expect(copyLabel("Fall", ["fall"])).toBe("Fall #2");
  expect(copyLabel("Fall", ["Fall", "Fall #2"])).toBe("Fall #3");
  expect(copyLabel("Fall #2", ["Fall", "Fall #2"])).toBe("Fall #3");
  expect(copyLabel("x".repeat(64), ["x".repeat(64)])).toBe(
    `${"x".repeat(61)} #2`,
  );
});
