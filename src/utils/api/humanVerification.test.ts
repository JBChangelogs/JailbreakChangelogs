import { expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";

function setup(responseUrl = "https://api.example.com/v2/users/me") {
  const response = new Response(null, {
    headers: { "Ban-Reference": "reference" },
  });
  Object.defineProperty(response, "url", { value: responseUrl });
  const promise = Promise.resolve(response);
  const originalFetch = mock(
    (_input: RequestInfo | URL, _init?: RequestInit) => promise,
  );
  const observeSiteBanResponse = mock(() => {});
  const window = {
    fetch: originalFetch as unknown as typeof fetch,
    location: { href: "https://api.example.com/page" },
  };
  const exports = {} as typeof import("./humanVerification");
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./humanVerification.ts", import.meta.url), "utf8"),
      { compilerOptions: { module: ModuleKind.CommonJS } },
    ).outputText,
    {
      exports,
      URL,
      Request,
      window,
      require: (name: string) => {
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.com" };
        if (name === "@/utils/api/apiDevToken") return {};
        if (name === "@/utils/api/siteBanInterceptor")
          return { observeSiteBanResponse };
        throw new Error(`Unexpected import ${name}`);
      },
    },
  );
  const listener = mock(() => {});
  exports.subscribeBanReference(listener);
  const uninstall = exports.installBanReferenceInterceptor();
  return {
    window,
    originalFetch,
    promise,
    response,
    observeSiteBanResponse,
    listener,
    uninstall,
  };
}

test("third-party requests preserve the original promise and skip observers", async () => {
  const context = setup();
  const error = new TypeError("Failed to fetch");
  const rejected = Promise.reject<Response>(error);
  context.originalFetch.mockReturnValue(rejected);
  const input = "https://s.nitropay.com/request";
  const init = { credentials: "omit" } as const;
  const result = context.window.fetch(input, init);
  expect(result).toBe(rejected);
  await expect(result).rejects.toBe(error);
  expect(context.originalFetch.mock.calls).toEqual([[input, init]]);
  expect(context.observeSiteBanResponse).not.toHaveBeenCalled();
  expect(context.listener).not.toHaveBeenCalled();
  context.uninstall();
  expect(Object.is(context.window.fetch, context.originalFetch)).toBe(true);
});

test("API strings, URLs, Requests and relative paths retain ban observation", async () => {
  for (const input of [
    "https://api.example.com/v2/users/me",
    new URL("https://api.example.com/v2/users/me"),
    new Request("https://api.example.com/v2/users/me"),
    "/v2/users/me",
  ]) {
    const context = setup();
    expect(await context.window.fetch(input)).toBe(context.response);
    expect(context.observeSiteBanResponse).toHaveBeenCalledWith(
      context.response,
    );
    expect(context.listener).toHaveBeenCalledWith("reference");
  }
});

test("API redirects to another origin do not trigger ban observers", async () => {
  const context = setup("https://other.example.com/redirected");
  await context.window.fetch("https://api.example.com/redirect");
  expect(context.observeSiteBanResponse).not.toHaveBeenCalled();
  expect(context.listener).not.toHaveBeenCalled();
});
