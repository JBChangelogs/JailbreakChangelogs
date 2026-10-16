import { afterEach, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { loginWithToken } from "./login";
import type { MeResponse } from "./normalizeMeResponse";

const originalDocument = Object.getOwnPropertyDescriptor(
  globalThis,
  "document",
);
const envNames = [
  "NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME",
  "NEXT_PUBLIC_DEV_TOKEN",
] as const;
const originalEnv = Object.fromEntries(
  envNames.map((name) => [name, process.env[name]]),
);
afterEach(() => {
  if (originalDocument)
    Object.defineProperty(globalThis, "document", originalDocument);
  else Reflect.deleteProperty(globalThis, "document");
  for (const name of envNames) {
    if (originalEnv[name] === undefined) delete process.env[name];
    else process.env[name] = originalEnv[name];
  }
});

test("login validates directly and stores a browser session only after success", async () => {
  process.env.NEXT_PUBLIC_RAILWAY_ENVIRONMENT_NAME = "development";
  process.env.NEXT_PUBLIC_DEV_TOKEN = "revoked-env-token";
  for (const hostname of [
    "localhost",
    "127.0.0.1",
    "jailbreakchangelogs.com",
    "testing.jailbreakchangelogs.com",
    "jailbreakchangelogs.com.example.org",
  ]) {
    const calls: { url: string; options: RequestInit }[] = [];
    const writes: string[] = [];
    let cookie = "jbcl_token=old-session";
    const document = {
      get cookie() {
        return cookie;
      },
      set cookie(value: string) {
        writes.push(value);
        cookie = value.split(";")[0]!;
      },
    };
    Object.defineProperty(globalThis, "document", {
      value: document,
      configurable: true,
    });
    const exports = {} as { loginWithToken: typeof loginWithToken };
    let status = 200;
    let networkFailure = false;
    const user: MeResponse = {
      id: "123",
      name: "test-user",
      username: "Test User",
      supporter: 0,
      avatar: "",
      settings: undefined,
      presence: { status: "Offline", last_updated: 0 },
    };
    const protocol =
      hostname === "localhost" || hostname === "127.0.0.1" ? "http:" : "https:";
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./login.ts", import.meta.url), "utf8"),
        {
          compilerOptions: { module: ModuleKind.CommonJS },
        },
      ).outputText,
      {
        exports,
        document,
        window: { location: { hostname, protocol } },
        fetch: async (url: string, options: RequestInit) => {
          calls.push({ url, options });
          if (networkFailure) throw new TypeError("Network unavailable");
          return Response.json(user, { status });
        },
        require: (name: string) => {
          if (name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://api.example.com" };
          if (name === "@/utils/api/apiDevToken")
            return { buildApiFetchRequest };
          throw new Error(`Unexpected import ${name}`);
        },
      },
    );
    expect(await exports.loginWithToken("fresh/session")).toEqual(user);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.example.com/v2/users/me");
    expect(calls[0]!.options.headers).toMatchObject({
      Authorization: "fresh/session",
    });
    expect(calls[0]!.options.credentials).toBe("omit");
    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain(
      "jbcl_token=fresh%2Fsession; Path=/; SameSite=Lax; Max-Age=2592000",
    );
    expect(writes[0]!.includes("Secure")).toBe(protocol === "https:");
    expect(writes[0]!.includes("Domain=.jailbreakchangelogs.com")).toBe(
      hostname === "jailbreakchangelogs.com" ||
        hostname === "testing.jailbreakchangelogs.com",
    );
    expect(
      buildApiFetchRequest("https://api.example.com", "/v2/users/me").headers
        .Authorization,
    ).toBe("fresh/session");

    status = 401;
    await expect(exports.loginWithToken("invalid-session")).rejects.toThrow(
      "Failed to validate token",
    );
    networkFailure = true;
    await expect(exports.loginWithToken("another-session")).rejects.toThrow(
      "Network unavailable",
    );
    expect(writes).toHaveLength(1);
    const previousRequests = calls.length;
    for (const token of ["", "undefined"]) {
      await expect(exports.loginWithToken(token)).rejects.toThrow(
        "Missing token",
      );
    }
    expect(calls).toHaveLength(previousRequests);
  }
});
