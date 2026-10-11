import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import { getGitHubUrl, getWebsiteVersion } from "./version";

const envNames = [
  "NEXT_PUBLIC_BUILD_COMMIT_SHA",
  "NEXT_PUBLIC_BUILD_TIME",
  "RAILWAY_ENVIRONMENT_NAME",
  "RAILWAY_SERVICE_NAME",
] as const;
const originalEnv = { ...process.env };
const fetchTarget = globalThis as {
  fetch: (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>;
};
let fetchSpy: ReturnType<typeof spyOn<typeof fetchTarget, "fetch">>;

beforeEach(() => {
  process.env.NEXT_PUBLIC_BUILD_COMMIT_SHA =
    "a9c72748f69a56c1055431e4f4cba0cf175ca0df";
  process.env.NEXT_PUBLIC_BUILD_TIME = "1791684000000";
  process.env.RAILWAY_ENVIRONMENT_NAME = "production";
  process.env.RAILWAY_SERVICE_NAME = "(Prod) FrontEnd";
  fetchSpy = spyOn(fetchTarget, "fetch").mockImplementation(() => {
    throw new Error("Version metadata must not make network requests");
  });
});

afterEach(() => {
  fetchSpy.mockRestore();
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

test("version identifies the deployed commit and keeps its build date across requests", async () => {
  const version = await getWebsiteVersion();
  expect(version).toEqual({
    version: "a9c7274",
    date: 1791684000000,
    branch: "production",
    commitUrl:
      "https://github.com/JBChangelogs/JailbreakChangelogs/commit/a9c72748f69a56c1055431e4f4cba0cf175ca0df",
  });
  expect(await getWebsiteVersion()).toEqual(version);
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("testing and production retain their environment and repository links", async () => {
  expect(getGitHubUrl()).toBe(
    "https://github.com/JBChangelogs/JailbreakChangelogs",
  );
  process.env.RAILWAY_SERVICE_NAME = "(Testing) FrontEnd";
  expect((await getWebsiteVersion()).branch).toBe("testing");
  expect(getGitHubUrl()).toBe(
    "https://github.com/JBChangelogs/JailbreakChangelogs/tree/testing",
  );
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("local development without build metadata keeps a usable fallback", async () => {
  for (const name of envNames) delete process.env[name];
  const version = await getWebsiteVersion();
  expect(version).toMatchObject({
    version: "unknown",
    branch: "development",
    commitUrl: "#",
  });
  expect(version.date).toBeGreaterThan(0);
  expect(fetchSpy).not.toHaveBeenCalled();
});
