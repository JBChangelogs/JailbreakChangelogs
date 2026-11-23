import { expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

function setup(
  responseUrl = "https://api.example.com/v2/users/me",
  isDevEnv = false,
) {
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
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2020,
        },
      },
    ).outputText,
    {
      exports,
      URL,
      Request,
      Headers,
      window,
      fetch: originalFetch,
      require: (name: string) => {
        if (name === "@/utils/api/api")
          return {
            PUBLIC_API_URL: "https://api.example.com",
            INVENTORY_API_URL: "https://inventory.example.com",
          };
        if (name === "@/utils/api/apiDevToken")
          return {
            getDevToken: () => ({ isDevEnv, injectedToken: "local-session" }),
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: {},
            }),
          };
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
    api: exports,
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
  const context = setup(undefined, true);
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

test("local inventory requests attach the dev token without replacing explicit authorization", async () => {
  const url = "https://inventory.example.com/v2/users/1";
  for (const input of [
    url,
    new URL(url),
    new Request(url, {
      headers: { "X-Source": "request-source" },
      credentials: "omit",
    }),
  ]) {
    const context = setup(undefined, true);
    await context.window.fetch(input);
    const init = context.originalFetch.mock.calls[0][1];
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "local-session",
    );
    if (input instanceof Request) {
      expect(new Headers(init?.headers).get("X-Source")).toBe("request-source");
      expect(init?.credentials).toBeUndefined();
    } else expect(init?.credentials).toBe("include");
    context.uninstall();
  }
  const context = setup(undefined, true);
  const controller = new AbortController();
  const init = {
    method: "POST",
    body: "payload",
    signal: controller.signal,
    credentials: "omit" as const,
    headers: { Authorization: "explicit-session", "X-Source": "source" },
  };
  await context.window.fetch(url, init);
  expect(context.originalFetch.mock.calls[0][1]).toEqual(init);
  context.uninstall();
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
    expect(context.listener).toHaveBeenCalledWith(
      "reference",
      undefined,
      "turnstile",
    );
  }
});

test("API redirects to another origin do not trigger ban observers", async () => {
  const context = setup("https://other.example.com/redirected");
  await context.window.fetch("https://api.example.com/redirect");
  expect(context.observeSiteBanResponse).not.toHaveBeenCalled();
  expect(context.listener).not.toHaveBeenCalled();
});

test("public API blocks pass the Captcha-Type header with a Turnstile fallback", async () => {
  for (const captchaType of ["turnstile", "jbcl", "both", "invalid", null]) {
    const context = setup();
    const response = new Response("Too many suspicious requests", {
      status: 403,
      headers: {
        "Ban-Reference": "reference",
        ...(captchaType === null ? {} : { "Captcha-Type": captchaType }),
      },
    });
    Object.defineProperty(response, "url", { value: context.response.url });
    context.originalFetch.mockReturnValue(Promise.resolve(response));
    expect(await context.window.fetch(response.url)).toBe(response);
    expect(context.listener).toHaveBeenCalledWith(
      "reference",
      undefined,
      captchaType === "jbcl" || captchaType === "both"
        ? captchaType
        : "turnstile",
    );
    context.uninstall();
  }
});

test("inventory API requests send cookies and a captcha 403 opens verification", async () => {
  const challenge = {
    detail: {
      error: "challenge_required",
      reason: "subnet_enumeration",
      message: "Please complete human verification to continue.",
    },
  };
  const cases = [
    { status: 403, body: challenge, notify: true },
    { status: 403, body: { detail: { error: "forbidden" } }, notify: false },
    { status: 200, body: challenge, notify: false },
  ];
  for (const { status, body, notify } of cases) {
    const context = setup();
    const response = new Response(JSON.stringify(body), { status });
    context.originalFetch.mockReturnValue(Promise.resolve(response));
    const input = "https://inventory.example.com/user?id=1";
    expect(await context.window.fetch(input, { method: "GET" })).toBe(response);
    expect(context.originalFetch.mock.calls[0][1]).toEqual({
      credentials: "include",
      method: "GET",
    });
    expect(context.observeSiteBanResponse).not.toHaveBeenCalled();
    if (notify)
      expect(context.listener).toHaveBeenCalledWith(
        null,
        "Please complete human verification to continue.",
        "turnstile",
      );
    else expect(context.listener).not.toHaveBeenCalled();
  }
});

test("inventory challenges carry the required captcha, including flat responses", async () => {
  for (const captchaType of ["turnstile", "jbcl", "both"] as const) {
    for (const nested of [true, false]) {
      const context = setup();
      const detail = { error: "challenge_required", captcha_type: captchaType };
      context.originalFetch.mockReturnValue(
        Promise.resolve(
          new Response(JSON.stringify(nested ? { detail } : detail), {
            status: 403,
          }),
        ),
      );
      await context.window.fetch("https://inventory.example.com/user?id=1");
      expect(context.listener).toHaveBeenCalledWith(
        null,
        undefined,
        captchaType,
      );
      context.uninstall();
    }
  }
});

test("verification sends exactly the collected tokens together with cookies", async () => {
  for (const tokens of [
    { token: "t" },
    { jbcl_token: "j" },
    { token: "t", jbcl_token: "j" },
  ]) {
    const context = setup();
    context.originalFetch.mockReturnValue(Promise.resolve(new Response("{}")));
    await context.api.submitHumanVerification(tokens);
    expect(context.originalFetch.mock.calls[0]).toEqual([
      "https://api.example.com/v2/human-verification",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(tokens),
        credentials: "include",
      },
    ]);
  }
});

test("captcha failures expose the new requirement and default missing types to Turnstile", async () => {
  for (const captchaType of [
    "turnstile",
    "jbcl",
    "both",
    undefined,
    "invalid",
  ]) {
    const context = setup();
    context.originalFetch.mockReturnValue(
      Promise.resolve(
        new Response(
          JSON.stringify({
            error: "captcha_failed",
            captcha_type: captchaType,
            message: "Try again",
          }),
          { status: 400 },
        ),
      ),
    );
    try {
      await context.api.submitHumanVerification({ token: "used" });
      throw new Error("Expected rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(context.api.CaptchaVerificationError);
      expect(
        (error as import("./humanVerification").CaptchaVerificationError)
          .captchaType,
      ).toBe(
        captchaType === "both" || captchaType === "jbcl"
          ? captchaType
          : "turnstile",
      );
      expect((error as Error).message).toBe("Try again");
    }
  }
});
