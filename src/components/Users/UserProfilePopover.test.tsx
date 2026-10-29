import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

interface Node {
  type: string;
  props: Record<string, unknown> & { children?: unknown };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("profile cards intercept plain clicks, preserve modified links, and stack above dialogs", async () => {
  let open = false;
  let query: {
    enabled: boolean;
    staleTime: number;
    queryFn: () => Promise<unknown>;
  };
  const requests: string[] = [];
  const exports = {} as { UserProfilePopover: (props: unknown) => Node };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./UserProfilePopover.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ESNext,
        },
      },
    ).outputText,
    {
      exports,
      fetch: async (url: string) => {
        requests.push(url);
        return { ok: true, json: async () => ({ description: "Hello" }) };
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: () => [
              open,
              (update: (value: boolean) => boolean) => {
                open = update(open);
              },
            ],
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: (options: typeof query) => {
              query = options;
              return {};
            },
          };
        if (name.endsWith("AuthContext"))
          return { useSafeAuthContext: () => null };
        if (name.endsWith("accentColor")) return { userCardAccent: () => null };
        if (name.endsWith("/utils"))
          return {
            cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
          };
        if (name.endsWith("/api"))
          return {
            PUBLIC_API_URL: "https://api.example.com",
            fetchUserById: async (id: string, baseUrl: string) => {
              requests.push(`${baseUrl}/v2/users/${id}?nocache=false`);
              return { id, username: "Alice" };
            },
          };
        if (name.endsWith("/popover"))
          return {
            Popover: "Popover",
            PopoverTrigger: "PopoverTrigger",
            PopoverContent: "PopoverContent",
          };
        if (name === "next/link") return { default: "Link" };
        if (name.endsWith("IconWrapper")) return { Icon: "Icon" };
        return {};
      },
    },
  );
  const render = () =>
    exports.UserProfilePopover({
      user: { id: "123", username: "Alice" },
      children: jsx("Link", { href: "/users/123" }),
    });
  const tree = render();
  expect(query!.enabled).toBe(false);
  expect(requests).toEqual([]);
  const trigger = nodes(tree).find((node) => node.type === "PopoverTrigger")!;
  const click = trigger.props.onClickCapture as (event: unknown) => void;
  let prevented = false;
  let stopped = false;
  const event = {
    button: 0,
    preventDefault: () => {
      prevented = true;
    },
    stopPropagation: () => {
      stopped = true;
    },
  };
  click(event);
  expect(prevented).toBe(true);
  expect(stopped).toBe(true);
  expect(open).toBe(true);
  render();
  expect(query!.enabled).toBe(true);
  expect(query!.staleTime).toBe(5 * 60_000);
  await query!.queryFn();
  expect(requests).toEqual([
    "https://api.example.com/v2/users/123?nocache=false",
    "https://api.example.com/v2/users/123/description",
  ]);

  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
    prevented = stopped = false;
    click({ ...event, [modifier]: true });
    expect(prevented).toBe(false);
    expect(stopped).toBe(false);
    expect(open).toBe(true);
  }
  click({ ...event, button: 1 });
  expect(prevented).toBe(false);
  expect(stopped).toBe(false);
  expect(open).toBe(true);

  const content = nodes(tree).find((node) => node.type === "PopoverContent")!;
  expect(content.props.className).toContain("z-[10001]");
  const dialog = readFileSync(
    new URL("../ui/dialog.tsx", import.meta.url),
    "utf8",
  );
  expect(dialog).toContain("z-[10000]");
});
