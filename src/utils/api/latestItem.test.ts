import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { fetchLatestItem } from "./api";
import * as apiDevToken from "./apiDevToken";

const originalFetch = globalThis.fetch;
let requestSpy: ReturnType<
  typeof spyOn<typeof apiDevToken, "buildApiFetchRequest">
>;

beforeEach(() => {
  requestSpy = spyOn(apiDevToken, "buildApiFetchRequest").mockImplementation(
    (_baseUrl, path) => ({
      url: `https://api.example.com${path}`,
      headers: { Authorization: "test-token" },
    }),
  );
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  requestSpy.mockRestore();
});

test("fetches the global latest item without pagination or filters", async () => {
  const item = { id: 587, name: "HyperShift", last_updated: 1792123149 };
  const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json(item),
  );
  const controller = new AbortController();

  expect(await fetchLatestItem(controller.signal)).toMatchObject(item);
  const [input, options] = fetchSpy.mock.calls[0];
  const url = new URL(String(input));
  expect(url.pathname).toBe("/v2/items/latest");
  expect(url.search).toBe("");
  expect(options?.signal).toBe(controller.signal);
  expect(options?.credentials).toBe("include");
  expect(options?.headers).toEqual({ Authorization: "test-token" });
});

test("rejects an unavailable latest item instead of returning an error as item data", async () => {
  spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({ error: "item_not_found" }, { status: 404 }),
  );

  await expect(fetchLatestItem()).rejects.toThrow(
    "Failed to fetch latest item (404)",
  );
});
