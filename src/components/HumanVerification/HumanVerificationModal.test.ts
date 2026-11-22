import { expect, mock, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import {
  CaptchaVerificationError,
  type CaptchaType,
} from "@/utils/api/humanVerification";

type Node = {
  type: string;
  props: {
    key?: number;
    onSuccess: (token: string) => void;
    onToken: (token: string) => void;
    onExpire: () => void;
  };
  children: Node[];
};

function setup(captchaType: CaptchaType, siteKey = "site-key") {
  const slots: unknown[] = [];
  let cursor = 0;
  const submit = mock(async (_tokens: unknown) => {});
  const verified = mock(() => {});
  const exports = {} as typeof import("./HumanVerificationModal");
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./HumanVerificationModal.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.React,
          target: ScriptTarget.ES2020,
        },
      },
    ).outputText,
    {
      exports,
      process: { env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey } },
      React: {
        createElement: (type: string, props: object, ...children: Node[]) => ({
          type,
          props: props ?? {},
          children: children.flat(),
        }),
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (value: unknown) => {
                  slots[index] = value;
                },
              ];
            },
            useRef: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = { current: initial };
              return slots[index];
            },
          };
        if (name.includes("TurnstileWidget")) return { default: "Turnstile" };
        if (name === "./JbclCaptcha") return { default: "JBCL" };
        if (name.includes("ui/dialog"))
          return Object.fromEntries(
            [
              "Dialog",
              "DialogContent",
              "DialogFooter",
              "DialogHeader",
              "DialogTitle",
            ].map((name) => [name, name]),
          );
        if (name.includes("humanVerification"))
          return { submitHumanVerification: submit, CaptchaVerificationError };
        throw new Error(`Unexpected import ${name}`);
      },
    },
  );
  let tree: Node;
  const render = () => {
    cursor = 0;
    tree = exports.default({
      isOpen: true,
      captchaType,
      reasonMessage: "Verify",
      isLoadingReason: false,
      onVerified: verified,
    }) as unknown as Node;
  };
  const find = (type: string, node = tree): Node | undefined => {
    if (!node || typeof node !== "object") return;
    if (type === "attempt" ? node.props.key !== undefined : node.type === type)
      return node;
    for (const child of node.children ?? []) {
      const found = find(type, child);
      if (found) return found;
    }
  };
  render();
  return { submit, verified, render, find };
}

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test("each captcha mode shows and submits only its required tokens", async () => {
  for (const kind of ["turnstile", "jbcl", "both"] as const) {
    const context = setup(kind, kind === "jbcl" ? "" : "site-key");
    expect(Boolean(context.find("Turnstile"))).toBe(kind !== "jbcl");
    expect(Boolean(context.find("JBCL"))).toBe(kind !== "turnstile");
    context.find("Turnstile")?.props.onSuccess("t");
    context.find("JBCL")?.props.onToken("j");
    await flush();
    expect(context.submit.mock.calls).toEqual([
      [
        {
          ...(kind !== "jbcl" ? { token: "t" } : {}),
          ...(kind !== "turnstile" ? { jbcl_token: "j" } : {}),
        },
      ],
    ]);
    expect(context.verified).toHaveBeenCalledTimes(1);
  }
});

test("both waits for either completion order and prevents duplicate submissions", async () => {
  for (const first of ["Turnstile", "JBCL"]) {
    const context = setup("both");
    const turnstile = context.find("Turnstile")!;
    const jbcl = context.find("JBCL")!;
    if (first === "Turnstile") turnstile.props.onSuccess("t");
    else jbcl.props.onToken("j");
    expect(context.submit).not.toHaveBeenCalled();
    turnstile.props.onSuccess("t");
    jbcl.props.onToken("j");
    jbcl.props.onToken("duplicate");
    await flush();
    expect(context.submit).toHaveBeenCalledTimes(1);
  }
});

test("failure adopts the server requirement, remounts widgets, and discards old tokens", async () => {
  const context = setup("jbcl");
  const old = context.find("JBCL")!;
  context.submit.mockRejectedValueOnce(
    new CaptchaVerificationError("Try both", "both"),
  );
  old.props.onToken("used");
  await flush();
  context.render();
  expect(context.find("Turnstile")).toBeDefined();
  expect(context.find("attempt")?.props.key).toBe(1);
  old.props.onToken("stale");
  context.find("Turnstile")!.props.onSuccess("fresh-t");
  expect(context.submit).toHaveBeenCalledTimes(1);
  context.find("JBCL")!.props.onToken("fresh-j");
  await flush();
  expect(context.submit.mock.calls[1]).toEqual([
    { token: "fresh-t", jbcl_token: "fresh-j" },
  ]);
});

test("expiry and network failure remount widgets without reusing collected tokens", async () => {
  const context = setup("both");
  context.find("JBCL")!.props.onToken("expired");
  context.find("JBCL")!.props.onExpire();
  context.render();
  context.find("Turnstile")!.props.onSuccess("t");
  expect(context.submit).not.toHaveBeenCalled();
  context.submit.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  context.find("JBCL")!.props.onToken("j");
  await flush();
  context.render();
  expect(context.find("attempt")?.props.key).toBe(2);
  context.find("JBCL")!.props.onToken("retry-j");
  expect(context.submit).toHaveBeenCalledTimes(1);
});
