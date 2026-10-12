import { afterEach, expect, test } from "bun:test";
import { checkDupe } from "./dupeCheck";

const originalFetch = globalThis.fetch;
const originalUrl = process.env.NEXT_PUBLIC_INVENTORY_API_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalUrl === undefined)
    delete process.env.NEXT_PUBLIC_INVENTORY_API_URL;
  else process.env.NEXT_PUBLIC_INVENTORY_API_URL = originalUrl;
});

test("checks the original owner and catalog ID using the dashboard endpoint", async () => {
  process.env.NEXT_PUBLIC_INVENTORY_API_URL = "https://inventory.example/";
  const result = {
    ratio: 0.45,
    check: true,
    is_duped: false,
    dupe_logged_at: 1791835200,
    original_logged_at: 1791748800,
  };
  let request: { url: string; options?: RequestInit } | undefined;
  globalThis.fetch = (async (
    url: string | URL | Request,
    options?: RequestInit,
  ) => {
    request = { url: String(url), options };
    return Response.json(result);
  }) as unknown as typeof fetch;
  expect(await checkDupe("235642012", 49)).toEqual(result);
  expect(request?.url).toBe("https://inventory.example/dupes/check");
  expect(request?.options?.method).toBe("POST");
  expect(JSON.parse(request?.options?.body as string)).toEqual({
    user_id: "235642012",
    item_id: 49,
  });
});

test("rejects missing owner details before sending a request", async () => {
  let requested = false;
  globalThis.fetch = (async () => {
    requested = true;
    return Response.json({});
  }) as unknown as typeof fetch;
  await expect(checkDupe("unknown", 49)).rejects.toThrow(
    "Missing original owner",
  );
  await expect(checkDupe("123", 0)).rejects.toThrow("Missing original owner");
  expect(requested).toBe(false);
});

test("preserves API errors and rejects malformed successful responses", async () => {
  process.env.NEXT_PUBLIC_INVENTORY_API_URL = "https://inventory.example";
  globalThis.fetch = (async () =>
    Response.json(
      { message: "No matching dupe record found." },
      { status: 404 },
    )) as unknown as typeof fetch;
  await expect(checkDupe("123", 49)).rejects.toThrow(
    "No matching dupe record found.",
  );
  globalThis.fetch = (async () =>
    Response.json({ ratio: 0.2 })) as unknown as typeof fetch;
  await expect(checkDupe("123", 49)).rejects.toThrow(
    "Invalid dupe check response",
  );
  globalThis.fetch = (async () => {
    throw new Error("Network unavailable");
  }) as unknown as typeof fetch;
  await expect(checkDupe("123", 49)).rejects.toThrow("Network unavailable");
});

test("rejects invalid logged dates instead of displaying incorrect history", async () => {
  process.env.NEXT_PUBLIC_INVENTORY_API_URL = "https://inventory.example";
  for (const date of [undefined, null, "1791835200", -1]) {
    for (const field of ["dupe_logged_at", "original_logged_at"]) {
      globalThis.fetch = (async () =>
        Response.json({
          ratio: 0.45,
          check: true,
          is_duped: true,
          dupe_logged_at: 1791835200,
          original_logged_at: 1791748800,
          [field]: date,
        })) as unknown as typeof fetch;
      await expect(checkDupe("123", 49)).rejects.toThrow(
        "Invalid dupe check response",
      );
    }
  }
});
