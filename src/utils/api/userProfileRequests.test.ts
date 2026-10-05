import { afterEach, expect, spyOn, test } from "bun:test";

import { BASE_API_URL, fetchUserById, fetchUserByIdForMetadata } from "./api";

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
