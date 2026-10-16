import { afterEach, expect, spyOn, test } from "bun:test";

import { BASE_API_URL, fetchUserById, fetchUserByIdForMetadata } from "./api";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";
import { ModuleKind, transpileModule } from "typescript";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("rejects invalid profile IDs before making any request", async () => {
  const fetchMock = spyOn(globalThis, "fetch").mockResolvedValue(
    Response.json({}),
  );
  const invalidIds = [
    "",
    "sasa",
    "../admin",
    "%2e%2e%2fadmin",
    "123/../../admin",
    "123?fields=password",
    "123#fragment",
    "https://127.0.0.1/",
    "//127.0.0.1/",
    "123\\..\\admin",
    " 123",
    "123\n",
    "123\r\n",
    "１２３",
    "1e3",
    "-123",
  ];

  for (const id of invalidIds) {
    await expect(fetchUserById(id)).rejects.toThrow("NOT_FOUND:");
    await expect(fetchUserByIdForMetadata(id)).rejects.toThrow("NOT_FOUND:");
  }

  expect(fetchMock).not.toHaveBeenCalled();
});

test("preserves large numeric IDs and disallows redirects for all profile requests", async () => {
  const id = "1234567890123456789";
  const user = { id, username: "test-user" };
  const fetchMock = spyOn(globalThis, "fetch");

  const profileBase = BASE_API_URL ?? "https://server-api.example.com";
  for (const [fetchUser, base] of [
    [() => fetchUserById(id, profileBase), profileBase],
    [() => fetchUserByIdForMetadata(id), BASE_API_URL],
  ] as const) {
    fetchMock.mockResolvedValueOnce(Response.json(user));
    expect(await fetchUser()).toEqual(user);
    const [url, options] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toStartWith(`${base}/v2/users/${id}?`);
    expect(options?.redirect).toBe("error");
  }

  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("client profile requests use the public base and preserve access errors", async () => {
  const id = "1234567890123456789";
  const publicBase = "https://public-api.example.com";
  const fetchMock = spyOn(globalThis, "fetch");
  fetchMock.mockResolvedValueOnce(Response.json({ id, username: "test-user" }));
  expect(await fetchUserById(id, publicBase)).toEqual({
    id,
    username: "test-user",
  });
  expect(String(fetchMock.mock.calls[0]![0])).toBe(
    `${publicBase}/v2/users/${id}?nocache=false`,
  );
  expect(fetchMock.mock.calls[0]![1]?.redirect).toBe("error");
  expect(fetchMock.mock.calls[0]![1]?.credentials).toBe("include");

  for (const [status, body, prefix] of [
    [403, { message: "This profile is private" }, "PRIVATE_PROFILE:"],
    [403, { message: "This user is banned" }, "BANNED_USER:"],
    [404, {}, "NOT_FOUND:"],
    [422, {}, "NOT_FOUND:"],
  ] as const) {
    fetchMock.mockResolvedValueOnce(Response.json(body, { status }));
    await expect(fetchUserById(id, publicBase)).rejects.toThrow(prefix);
  }
});

test("user list and search send cookies and preserve cancellation", async () => {
  const exports = {} as typeof import("./api");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./api.ts", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      require: createRequire(import.meta.url),
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.com" } },
      URLSearchParams,
      fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args),
    },
  );
  const signal = new AbortController().signal;
  const fetchMock = spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(Response.json({ users: [] }))
    .mockResolvedValueOnce(Response.json({ users: [] }));
  await exports.fetchPaginatedUsers(1, 30, signal);
  await exports.searchUsers("test-user", 30, signal);
  for (const [, options] of fetchMock.mock.calls) {
    expect(options?.credentials).toBe("include");
    expect(options?.signal).toBe(signal);
  }
});
