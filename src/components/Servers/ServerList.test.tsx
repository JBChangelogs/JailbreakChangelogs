import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Node = { type: unknown; props: Record<string, unknown> };
function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

test("confirmed server deletion removes the card and updates pagination even if refresh fails", async () => {
  for (const [status, query] of [
    [200, ""],
    [200, "grinding"],
    [403, ""],
  ] as const) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const key = ["servers", 2, query, "newest"];
    const server = {
      id: 42,
      link: "https://www.roblox.com/share?code=test",
      rules: "Grinding",
      expires: "Never",
      created_at: "1700000000",
      user: { id: "owner", username: "Owner", premiumtype: 0 },
    };
    const data = {
      items: [server],
      total: 25,
      page: 2,
      total_pages: 2,
      size: 24,
    };
    client.setQueryData(key, data);
    const state: unknown[] = [];
    let cursor = 0;
    let queryFn!: (context: { signal: AbortSignal }) => Promise<unknown>;
    const requests: { url: string; options: RequestInit }[] = [];
    const exports = {} as { default: () => unknown };
    const jsx = (type: unknown, props: unknown) => ({ type, props });
    runInNewContext(
      transpileModule(
        readFileSync(new URL("./ServerList.tsx", import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        URLSearchParams,
        setTimeout: (callback: () => void) => callback(),
        fetch: async (url: string, options: RequestInit) => {
          requests.push({ url, options });
          return Response.json(
            {},
            { status: options.method === "DELETE" ? status : 503 },
          );
        },
        require: (name: string) => {
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "react")
            return {
              default: {
                useState: (initial: unknown) => {
                  const index = cursor++;
                  if (!(index in state)) state[index] = initial;
                  return [
                    state[index],
                    (value: unknown) => {
                      state[index] = value;
                    },
                  ];
                },
                useRef: () => ({ current: new Map() }),
                useCallback: (callback: unknown) => callback,
                useEffect: () => {},
              },
            };
          if (name === "@tanstack/react-query")
            return {
              useQueryClient: () => client,
              useQuery: (options: {
                queryKey: unknown[];
                queryFn: typeof queryFn;
              }) => {
                if (options.queryKey[0] === "server-sorts") return { data: [] };
                queryFn = options.queryFn;
                return {
                  data: client.getQueryData(key),
                  isPending: false,
                  refetch: () => {},
                };
              },
            };
          if (name === "nuqs")
            return {
              parseAsString: { withDefault: () => ({}) },
              parseAsInteger: { withDefault: () => ({}) },
              useQueryStates: () => [
                { query, page: 2, sort: "newest" },
                () => {},
              ],
            };
          if (name === "@/contexts/AuthContext")
            return {
              useAuthContext: () => ({
                isAuthenticated: true,
                user: { id: "owner" },
              }),
            };
          if (name === "@/utils/api/api")
            return {
              PUBLIC_API_URL: "https://api.example.com",
              getResponseErrorMessage: async () => "Request failed",
            };
          if (name === "@/utils/api/apiDevToken")
            return {
              buildApiFetchRequest: (base: string, path: string) => ({
                url: base + path,
                headers: {},
              }),
            };
          if (name === "dompurify")
            return { default: { sanitize: (value: string) => value } };
          if (name === "@/utils/helpers/timestamp")
            return { formatProfileDate: (value: string) => value };
          if (name === "@/utils/ui/sanitizeText")
            return { sanitizeText: (value: string) => value };
          if (name === "@/services/logger")
            return { createLogger: () => ({ error() {} }) };
          if (name === "sonner")
            return { toast: { loading() {}, error() {}, success() {} } };
          return new Proxy({}, { get: (_, property) => String(property) });
        },
      },
    );
    const render = () => {
      cursor = 0;
      return nodes(exports.default());
    };
    const action = render().find(
      (node) =>
        node.type === "DropdownMenuItem" &&
        Array.isArray(node.props.children) &&
        node.props.children.includes("Delete server"),
    )!;
    (action.props.onSelect as () => void)();
    const confirm = render().find(
      (node) => node.type === "Button" && node.props.children === "Delete",
    )!;
    await (confirm.props.onClick as () => Promise<void>)();
    expect(requests[0]?.options.method).toBe("DELETE");
    expect(requests[0]?.url).toBe("https://api.example.com/v2/servers/42");
    const result = client.getQueryData<typeof data>(key)!;
    expect(result.items).toHaveLength(status === 200 ? 0 : 1);
    expect(result.total).toBe(status === 200 ? 24 : 25);
    expect(result.total_pages).toBe(status === 200 ? 1 : 2);
    await expect(
      queryFn({ signal: new AbortController().signal }),
    ).rejects.toThrow("Request failed");
    expect(requests.at(-1)!.options.cache).toBe("no-store");
    expect(client.getQueryData<typeof data>(key)!.items).toHaveLength(
      status === 200 ? 0 : 1,
    );
    client.clear();
  }
});
