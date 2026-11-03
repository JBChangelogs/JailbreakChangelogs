import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Node = {
  type: unknown;
  props: Record<string, unknown> & { children?: unknown };
};

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function setup() {
  const auth = { isAuthenticated: true, user: { id: "viewer" } };
  const state: unknown[] = [];
  let cursor = 0;
  let response: Response | Error = Response.json({ id: "report-id" });
  const requests: { url: string; options: RequestInit }[] = [];
  const messages: string[] = [];
  const copiedLinks: string[] = [];
  const exports = {} as { default: (props: unknown) => Node | null };
  const jsx = (type: unknown, props: unknown) => ({ type, props });

  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./ReportServerButton.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Error,
      navigator: {
        clipboard: {
          writeText: async (link: string) => copiedLinks.push(link),
        },
      },
      fetch: async (url: string, options: RequestInit) => {
        requests.push({ url, options });
        if (response instanceof Error) throw response;
        return response;
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in state)) state[index] = initial;
              return [state[index], (value: unknown) => (state[index] = value)];
            },
          };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => auth };
        if (name === "sonner")
          return {
            toast: Object.fromEntries(
              ["success", "info", "error"].map((type) => [
                type,
                (message: string) => messages.push(message),
              ]),
            ),
          };
        if (name === "@/utils/api/api")
          return { PUBLIC_API_URL: "https://api.example.com" };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: { "X-Dev-Token": "test-token" },
            }),
          };
        if (name === "@/utils/api/ban") return { parseBan: () => null };
        if (name === "@/utils/ui/sanitizeText")
          return { sanitizeText: (value: string) => value };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );

  const render = () => {
    cursor = 0;
    return exports.default({
      server: {
        id: 42,
        link: "https://www.roblox.com/share?code=private-server&type=Server",
        rules: "No exploiting",
        user: { id: "owner", username: "Owner" },
      },
    });
  };
  const modal = () =>
    nodes(render()).find((node) => node.type === "ReportReasonModal");
  const open = () => {
    const button = nodes(render()).find((node) => node.type === "Button")!;
    (button.props.onClick as () => void)();
  };

  return {
    auth,
    render,
    modal,
    open,
    requests,
    messages,
    copiedLinks,
    respond: (value: Response | Error) => (response = value),
  };
}

test("report previews show the rules and copy the full server link", async () => {
  const view = setup();
  view.open();
  const preview = nodes(view.modal());
  const link = preview.find(
    (node) =>
      node.props.title ===
      "https://www.roblox.com/share?code=private-server&type=Server",
  );
  expect(link?.props.children).toBe(link?.props.title);
  expect(preview.some((node) => node.props.children === "No exploiting")).toBe(
    true,
  );
  expect(preview.some((node) => node.type === "a")).toBe(false);
  const copy = preview.find(
    (node) => node.props["aria-label"] === "Copy server link",
  )!;
  await (copy.props.onClick as () => Promise<void>)();
  expect(view.copiedLinks).toEqual([
    "https://www.roblox.com/share?code=private-server&type=Server",
  ]);
  expect(view.messages).toContain("Server link copied to clipboard!");
  expect(view.requests).toHaveLength(0);
});

test("server reporting is hidden for visitors and owners", () => {
  const view = setup();
  expect(view.render()).not.toBeNull();
  view.auth.isAuthenticated = false;
  expect(view.render()).toBeNull();
  view.auth.isAuthenticated = true;
  view.auth.user.id = "owner";
  expect(view.render()).toBeNull();
  expect(view.requests).toHaveLength(0);
});

test("server reports send the reason with credentials and resolve API outcomes", async () => {
  for (const [status, body, message, closes] of [
    [200, { id: "report-id" }, "Report submitted", true],
    [
      400,
      { error: "report_exists" },
      "You have already reported this server.",
      true,
    ],
    [400, { error: "self_report" }, "You cannot report your own server.", true],
    [404, {}, "This server is no longer available.", true],
    [500, { message: "Try again later" }, "Try again later", false],
  ] as const) {
    const view = setup();
    view.respond(Response.json(body, { status }));
    view.open();
    (view.modal()!.props.setReportReason as (value: string) => void)(
      "  Link leads to a scam game  ",
    );
    await (view.modal()!.props.onSubmit as (value: string) => Promise<void>)(
      view.modal()!.props.reportReason as string,
    );
    expect(view.requests).toHaveLength(1);
    expect(view.requests[0]).toEqual({
      url: "https://api.example.com/v2/servers/42/reports",
      options: {
        method: "POST",
        credentials: "include",
        headers: {
          "X-Dev-Token": "test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: "Link leads to a scam game" }),
      },
    });
    expect(view.messages).toContain(message);
    expect(Boolean(view.modal())).toBe(!closes);
    if (!closes)
      expect(view.modal()!.props.reportReason).toBe(
        "  Link leads to a scam game  ",
      );
  }
});

test("blank reasons send no request and network failures keep the reason for retry", async () => {
  const view = setup();
  view.open();
  const submit = view.modal()!.props.onSubmit as (
    value: string,
  ) => Promise<void>;
  await submit("   ");
  expect(view.requests).toHaveLength(0);
  (view.modal()!.props.setReportReason as (value: string) => void)("Scam link");
  view.respond(new Error("Network unavailable"));
  await submit("Scam link");
  expect(view.messages).toContain("Network unavailable");
  expect(view.modal()!.props.reportReason).toBe("Scam link");
  (view.modal()!.props.onClose as () => void)();
  view.open();
  expect(view.modal()!.props.reportReason).toBe("");
});
