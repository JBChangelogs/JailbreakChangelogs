import { afterEach, expect, spyOn, test } from "bun:test";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

const originalFetch = globalThis.fetch;
const originalEnvironment = process.env.RAILWAY_ENVIRONMENT_NAME;
const originalApi = process.env.RAILWAY_INTERNAL_API_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalEnvironment === undefined)
    delete process.env.RAILWAY_ENVIRONMENT_NAME;
  else process.env.RAILWAY_ENVIRONMENT_NAME = originalEnvironment;
  if (originalApi === undefined) delete process.env.RAILWAY_INTERNAL_API_URL;
  else process.env.RAILWAY_INTERNAL_API_URL = originalApi;
});

test("production experiments routes require a session, including subpaths and token query strings", async () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  const fetchMock = spyOn(globalThis, "fetch");
  for (const path of [
    "/experiments",
    "/experiments/",
    "/experiments/test",
    "/experiments?token=unverified",
  ]) {
    const response = await proxy(
      new NextRequest(`https://jailbreakchangelogs.com${path}`),
    );
    expect(response.headers.get("location")).toBe(
      "https://jailbreakchangelogs.com/",
    );
  }
  expect(fetchMock).not.toHaveBeenCalled();
});

test("production experiments access uses enabled flags from the backend, not the session cookie alone", async () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  process.env.RAILWAY_INTERNAL_API_URL = "https://internal.example.com";
  const fetchMock = spyOn(globalThis, "fetch");
  const request = () =>
    new NextRequest("https://jailbreakchangelogs.com/experiments", {
      headers: { cookie: "jbcl_token=session" },
    });
  for (const [flag, enabled, allowed] of [
    ["is_tester", true, true],
    ["is_owner", true, true],
    ["is_tester", false, false],
    ["is_owner", false, false],
    ["website_moderator", true, false],
    ["is_tester", undefined, false],
  ] as const) {
    fetchMock.mockResolvedValueOnce(
      Response.json({ flags: [{ flag, enabled }] }),
    );
    const response = await proxy(request());
    if (allowed) expect(response.headers.get("x-middleware-next")).toBe("1");
    else
      expect(response.headers.get("location")).toBe(
        "https://jailbreakchangelogs.com/",
      );
    expect(fetchMock.mock.calls.at(-1)).toEqual([
      "https://internal.example.com/v2/users/me",
      {
        cache: "no-store",
        headers: {
          Authorization: "session",
          "User-Agent": "JailbreakChangelogs-Auth/1.0",
        },
      },
    ]);
  }
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
  expect((await proxy(request())).headers.get("location")).toBe(
    "https://jailbreakchangelogs.com/",
  );
  fetchMock.mockRejectedValueOnce(new Error("API unavailable"));
  expect((await proxy(request())).headers.get("location")).toBe(
    "https://jailbreakchangelogs.com/",
  );
});

test("other production routes remain public and testing deployments keep their access-denied redirect", async () => {
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  const fetchMock = spyOn(globalThis, "fetch");
  expect(
    (
      await proxy(new NextRequest("https://jailbreakchangelogs.com/users"))
    ).headers.get("x-middleware-next"),
  ).toBe("1");
  process.env.RAILWAY_ENVIRONMENT_NAME = "testing";
  expect(
    (
      await proxy(
        new NextRequest("https://jailbreakchangelogs.com/experiments"),
      )
    ).headers.get("location"),
  ).toBe("https://jailbreakchangelogs.com/access-denied");
  expect(fetchMock).not.toHaveBeenCalled();
});
