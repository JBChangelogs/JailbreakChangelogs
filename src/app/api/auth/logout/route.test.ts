import { afterEach, expect, spyOn, test } from "bun:test";
import { POST } from "./route";

const originalEnv = process.env.RAILWAY_ENVIRONMENT_NAME;
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalEnv === undefined) delete process.env.RAILWAY_ENVIRONMENT_NAME;
  else process.env.RAILWAY_ENVIRONMENT_NAME = originalEnv;
});

test("logout route only expires the cookie and never proxies session invalidation", async () => {
  const fetchMock = spyOn(globalThis, "fetch");
  for (const environment of ["production", "testing", "development"]) {
    process.env.RAILWAY_ENVIRONMENT_NAME = environment;
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const cookie = response.headers.get("Set-Cookie")!;
    expect(cookie).toContain("jbcl_token=;");
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("Path=/");
    expect(cookie.includes("Domain=.jailbreakchangelogs.com")).toBe(
      environment !== "development",
    );
    expect(cookie.includes("Secure")).toBe(environment !== "development");
  }
  expect(fetchMock).not.toHaveBeenCalled();
});
