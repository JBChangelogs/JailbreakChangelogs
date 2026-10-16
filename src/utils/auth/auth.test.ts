import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

test("logout revokes directly, clears locally, and reports incomplete revocation", async () => {
  for (const status of [
    200,
    401,
    403,
    500,
    "network",
    "timeout",
    "cookie-failure",
  ] as const) {
    const requests: { url: string; options: RequestInit }[] = [];
    const removed: string[] = [];
    const events: Event[] = [];
    let toastOptions:
      | {
          success: (revoked: boolean) => { description: string };
          error: { description: string };
        }
      | undefined;
    const exports = {} as { logout: () => Promise<boolean> };
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./auth.ts", import.meta.url), "utf8"),
        {
          compilerOptions: { module: ModuleKind.CommonJS },
        },
      ).outputText,
      {
        exports,
        AbortSignal,
        CustomEvent,
        window: { dispatchEvent: (event: Event) => events.push(event) },
        fetch: async (url: string, options: RequestInit) => {
          requests.push({ url, options });
          if (url === "/api/auth/logout") {
            return Response.json(
              {},
              { status: status === "cookie-failure" ? 500 : 200 },
            );
          }
          if (status === "network") throw new TypeError("Network unavailable");
          if (status === "timeout")
            throw new DOMException("Timed out", "TimeoutError");
          return Response.json(
            {},
            { status: typeof status === "number" ? status : 200 },
          );
        },
        require: (name: string) => {
          switch (name) {
            case "sonner":
              return {
                toast: {
                  promise: (
                    promise: Promise<unknown>,
                    options: typeof toastOptions,
                  ) => {
                    toastOptions = options;
                    promise.catch(() => {});
                  },
                },
              };
            case "@/utils/storage/safeStorage":
              return {
                safeLocalStorage: {
                  removeItem: (key: string) => removed.push(key),
                },
              };
            case "@/services/logger":
              return {
                createLogger: () => ({ info() {}, warn() {}, error() {} }),
              };
            case "@/utils/api/api":
              return { PUBLIC_API_URL: "https://api.example.com" };
            case "@/utils/api/apiDevToken":
              return {
                buildApiFetchRequest: (base: string, path: string) => ({
                  url: base + path,
                  headers: { Authorization: "local-dev-token" },
                }),
              };
            default:
              throw new Error(`Unexpected import ${name}`);
          }
        },
      },
    );
    if (status === "cookie-failure") {
      await expect(exports.logout()).rejects.toThrow("Failed to clear session");
      expect(removed).toEqual([]);
      expect(events).toEqual([]);
      expect(toastOptions!.error.description).toContain(
        "try logging out again",
      );
    } else {
      const revoked = await exports.logout();
      expect(revoked).toBe(status === 200 || status === 401);
      expect(removed).toEqual(["user", "userid", "avatar"]);
      expect(events.map((event) => event.type)).toEqual(["authStateChanged"]);
      expect(toastOptions!.success(revoked).description).toBe(
        revoked
          ? "Your session has been invalidated."
          : "We couldn't invalidate your session with the API. The session token may still be active.",
      );
    }
    expect(requests.map(({ url }) => url)).toEqual([
      "https://api.example.com/v2/users/me/session",
      "/api/auth/logout",
    ]);
    expect(requests[0]!.options.method).toBe("DELETE");
    expect(requests[0]!.options.credentials).toBe("include");
    expect(requests[0]!.options.headers).toEqual({
      Authorization: "local-dev-token",
    });
    expect(requests[0]!.options.signal).toBeInstanceOf(AbortSignal);
    expect(requests[1]!.options.method).toBe("POST");
  }
});
