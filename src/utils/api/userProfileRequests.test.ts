import { afterEach, expect, spyOn, test } from "bun:test";

import {
  BASE_API_URL,
  fetchUserById,
  fetchUserByIdForMetadata,
  fetchUserByIdForOG,
} from "./api";

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
    expect(await fetchUserByIdForOG(id)).toBeNull();
  }

  expect(fetchMock).not.toHaveBeenCalled();
});

test("preserves large numeric IDs and disallows redirects for all profile requests", async () => {
  const id = "1234567890123456789";
  const user = { id, username: "test-user" };
  const fetchMock = spyOn(globalThis, "fetch");

  for (const fetchUser of [
    fetchUserById,
    fetchUserByIdForMetadata,
    fetchUserByIdForOG,
  ]) {
    fetchMock.mockResolvedValueOnce(Response.json(user));
    expect(await fetchUser(id)).toEqual(user);
    const [url, options] = fetchMock.mock.calls.at(-1)!;
    expect(String(url)).toStartWith(`${BASE_API_URL}/v2/users/${id}?`);
    expect(options?.redirect).toBe("error");
  }

  expect(fetchMock).toHaveBeenCalledTimes(3);
});
