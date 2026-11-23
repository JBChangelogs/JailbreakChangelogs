import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { LoginModalController } from "./useLoginModalController";
import { getCaptchaType } from "@/utils/api/humanVerification";

type Element = { type: string; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("login provider follows auth state and linked accounts do not open the modal", () => {
  let auth: Record<string, unknown> = {};
  const effects: (() => void)[] = [];
  const controllerModule = {} as {
    useLoginModalController: () => LoginModalController;
  };
  const view = {} as { default: (props: unknown) => Element };
  const jsx = (type: string, props: Element["props"]): Element => ({
    type,
    props,
  });
  for (const [path, exports] of [
    ["./useLoginModalController.ts", controllerModule],
    ["./LoginModalView.tsx", view],
  ] as const) {
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      }).outputText,
      {
        exports,
        document: { cookie: "jbcl_token=stale-session" },
        require: (name: string) => {
          if (name === "react")
            return {
              useState: () => [false, () => {}],
              useCallback: (fn: unknown) => fn,
              useEffect: (effect: () => void) => effects.push(effect),
            };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/contexts/AuthContext")
            return { useAuthContext: () => auth };
          if (name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://api.example.com" };
          if (name === "@/utils/api/apiDevToken" || name === "sonner")
            return {};
          return Object.fromEntries(
            [
              "Dialog",
              "DialogContent",
              "DialogTitle",
              "DialogDescription",
              "Button",
              "Checkbox",
              "Icon",
            ].map((key) => [key, key]),
          );
        },
      },
    );
  }
  for (const [isAuthenticated, user, open, expectedProvider] of [
    [false, null, true, "Discord"],
    [false, { roblox_id: "123" }, true, "Discord"],
    [true, null, false, "Discord"],
    [true, { roblox_id: "" }, true, "Roblox"],
    [true, { roblox_id: null }, true, "Roblox"],
    [true, { roblox_id: "123" }, false, "Discord"],
  ] as const) {
    const changes: unknown[] = [];
    auth = {
      isAuthenticated,
      user,
      showLoginModal: true,
      setLoginModal: (value: unknown) => changes.push(value),
    };
    const controller = controllerModule.useLoginModalController();
    const tree = elements(
      view.default({
        ...controller,
        onClose: controller.handleClose,
        onJoinDiscordChange: controller.setJoinDiscord,
        onDiscordLogin: controller.handleDiscordLogin,
        onRobloxLogin: controller.handleRobloxLogin,
      }),
    );
    expect(tree.find((node) => node.type === "Dialog")!.props.open).toBe(open);
    const buttons = tree.filter((node) => node.type === "Button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].props["data-rybbit-event"]).toBe(
      `Login with ${expectedProvider}`,
    );
    expect(buttons[0].props.onClick).toBe(
      expectedProvider === "Roblox"
        ? controller.handleRobloxLogin
        : controller.handleDiscordLogin,
    );
    expect(tree.some((node) => node.type === "Checkbox")).toBe(
      expectedProvider === "Discord",
    );
    controller.handleClose();
    expect(changes).toEqual([{ open: false }]);
  }

  auth = {
    isAuthenticated: true,
    user: { roblox_id: "123" },
    showLoginModal: true,
    setLoginModal: ({ open }: { open: boolean }) => {
      auth.showLoginModal = open;
    },
  };
  effects.length = 0;
  expect(controllerModule.useLoginModalController().showLoginModal).toBe(false);
  effects.forEach((effect) => effect());
  expect(auth.showLoginModal).toBe(false);
  auth.user = { roblox_id: null };
  expect(controllerModule.useLoginModalController().showLoginModal).toBe(false);
  auth.showLoginModal = true;
  expect(controllerModule.useLoginModalController().canLinkRoblox).toBe(true);
  expect(controllerModule.useLoginModalController().showLoginModal).toBe(true);
});

function setupDiscordLogin(response: Response | { status: number } | Error) {
  const slots: unknown[] = [];
  let cursor = 0;
  const requests: { url: string; init: RequestInit }[] = [];
  const errors: string[] = [];
  const location = {
    href: "https://jailbreakchangelogs.com/trading?sort=new#ads",
  };
  const controllerModule = {} as typeof import("./useLoginModalController");
  const modalModule = {} as typeof import("./LoginModal");
  const jsx = (type: string | (() => Element), props: Element["props"]) =>
    typeof type === "function" ? type() : { type, props };
  for (const [path, exports] of [
    ["./useLoginModalController.ts", controllerModule],
    ["./LoginModal.tsx", modalModule],
  ] as const) {
    runInNewContext(
      transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      }).outputText,
      {
        exports,
        window: { location },
        fetch: async (url: string, init: RequestInit) => {
          requests.push({ url, init });
          if (response instanceof Error) throw response;
          return response;
        },
        require: (name: string) => {
          if (name === "react")
            return {
              Suspense: "Suspense",
              useCallback: (fn: unknown) => fn,
              useEffect: () => {},
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
            };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/contexts/AuthContext")
            return { useAuthContext: () => ({ showLoginModal: true }) };
          if (name === "@/contexts/ThemeContext")
            return { useTheme: () => ({}) };
          if (name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://api.example.com" };
          if (name === "@/utils/api/apiDevToken") return {};
          if (name === "@/utils/api/humanVerification")
            return { getCaptchaType };
          if (name === "sonner")
            return {
              toast: {
                loading: () => {},
                error: (message: string) => errors.push(message),
              },
            };
          if (name === "./useLoginModalController") return controllerModule;
          if (name === "./LoginModalView") return { default: "LoginModalView" };
          if (name.includes("HumanVerificationModal"))
            return { default: "HumanVerificationModal" };
          throw new Error(`Unexpected import ${name}`);
        },
      },
    );
  }
  const controller = () => {
    cursor = 0;
    return controllerModule.useLoginModalController();
  };
  return {
    controller,
    requests,
    errors,
    location,
    render: () => {
      cursor = 0;
      return elements(modalModule.default());
    },
  };
}

test("Discord login preflights with cookies and manual redirects before navigation", async () => {
  for (const response of [
    { status: 0 },
    { status: 302 },
    Response.json({ error: "other" }, { status: 403 }),
  ]) {
    const context = setupDiscordLogin(response);
    const originalUrl = context.location.href;
    await context.controller().handleDiscordLogin();
    expect(context.requests).toEqual([
      {
        url: `https://api.example.com/oauth?redirect=${encodeURIComponent(originalUrl)}`,
        init: { credentials: "include", redirect: "manual" },
      },
    ]);
    expect(context.location.href).toBe(context.requests[0]!.url);
    expect(context.controller().verification).toBeNull();
  }
});

test("Discord challenges render the requested captcha and resume the original OAuth URL after verification", async () => {
  for (const captchaType of ["turnstile", "jbcl", "both"]) {
    const context = setupDiscordLogin(
      Response.json(
        {
          error: "challenge_required",
          reason: "proxy_ip",
          captcha_type: captchaType,
          message: "Please complete human verification to continue.",
        },
        { status: 403 },
      ),
    );
    const originalUrl = context.location.href;
    context.controller().setJoinDiscord(true);
    await context.controller().handleDiscordLogin();
    expect(context.location.href).toBe(originalUrl);
    const modal = context
      .render()
      .find((node) => node.type === "HumanVerificationModal")!;
    expect(modal.props.captchaType).toBe(captchaType);
    expect(modal.props.reasonMessage).toBe(
      "Please complete human verification to continue.",
    );
    expect(modal.props.isOpen).toBe(true);
    expect(
      context.render().some((node) => node.type === "LoginModalView"),
    ).toBe(false);
    (modal.props.onVerified as () => void)();
    expect(context.location.href).toBe(
      `https://api.example.com/oauth?redirect=${encodeURIComponent(originalUrl)}&join_discord=true`,
    );
    expect(context.requests).toHaveLength(1);
  }
});

test("Discord preflight network failures keep the page and show a retry message", async () => {
  const context = setupDiscordLogin(new TypeError("Failed to fetch"));
  const originalUrl = context.location.href;
  await context.controller().handleDiscordLogin();
  expect(context.location.href).toBe(originalUrl);
  expect(context.controller().verification).toBeNull();
  expect(context.errors).toEqual([
    "Unable to start Discord login. Please try again.",
  ]);
});
