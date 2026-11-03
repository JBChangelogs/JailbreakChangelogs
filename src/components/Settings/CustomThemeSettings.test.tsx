import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { UserTheme } from "@/utils/api/userThemes";
import type { CustomThemesState } from "./CustomThemeSettings";

interface Node {
  type: string;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function settings({ published = false, own = true, fail = false } = {}) {
  const theme: UserTheme = {
    id: 1,
    share_code: "ABCDEFGH",
    label: "Mine",
    scheme: "dark",
    vars: {},
    logo_filter: null,
    published_at: published ? 123 : null,
  };
  const states: unknown[] = [];
  let cursor = 0;
  const updates: unknown[] = [];
  const invalidations: unknown[] = [];
  const errors: unknown[] = [];
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const exports = {} as {
    useCustomThemes: () => CustomThemesState;
    CustomThemeMenu: (props: {
      theme: UserTheme;
      custom: CustomThemesState;
      children: null;
    }) => Node;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./CustomThemeSettings.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Error,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
            useEffect: () => {},
            useSyncExternalStore: () => [],
          };
        if (name === "next/navigation")
          return {
            useRouter: () => ({ push() {} }),
            usePathname: () => "/settings",
            useSearchParams: () => new URLSearchParams(),
          };
        if (name === "next/link") return { default: "Link" };
        if (name === "@tanstack/react-query")
          return {
            useQuery: () => ({
              data: { themes: own ? [theme] : [], limit: 10 },
            }),
            useQueries: () => [],
            useQueryClient: () => ({
              invalidateQueries: async ({
                queryKey,
              }: {
                queryKey: unknown;
              }) => {
                invalidations.push(queryKey);
              },
            }),
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              isAuthenticated: true,
              user: { id: "me", premiumtype: 2 },
            }),
          };
        if (name === "@/contexts/ThemeContext")
          return { useTheme: () => ({ customTheme: null }) };
        if (name === "@/utils/api/userThemes")
          return {
            updateMyTheme: async (id: number, input: unknown) => {
              updates.push({ id, input });
              if (fail) throw new Error("Choose another theme name.");
            },
          };
        if (name === "sonner")
          return {
            toast: {
              success() {},
              error: (message: string, options: unknown) =>
                errors.push({ message, options }),
            },
          };
        if (name.startsWith("@/components/"))
          return new Proxy({}, { get: (_target, key) => String(key) });
        if (name.startsWith("@/utils/") || name === "@/config/settings")
          return {};
        throw new Error(`Unexpected import: ${name}`);
      },
      URLSearchParams,
    },
  );
  const render = () => {
    cursor = 0;
    const custom = exports.useCustomThemes();
    const menu = nodes(
      exports.CustomThemeMenu({ theme, custom, children: null }),
    );
    const publishAction = menu.find(
      (node) =>
        node.type === "DropdownMenuItem" &&
        nodes(node.props.children).some(
          (child) => child.props.icon === "lucide:globe",
        ),
    );
    return { custom, publishAction };
  };
  return { theme, render, updates, invalidations, errors };
}

for (const published of [false, true]) {
  test(`custom theme card can ${published ? "unpublish" : "publish"} without opening the editor`, async () => {
    const view = settings({ published });
    const { publishAction } = view.render();
    expect(publishAction?.props.children).toContain(
      published ? "Remove from marketplace" : "Publish to marketplace",
    );
    (publishAction!.props.onSelect as () => void)();
    expect(view.render().publishAction?.props.disabled).toBe(true);
    await new Promise((resolve) => setImmediate(resolve));
    expect(view.updates).toEqual([{ id: 1, input: { published: !published } }]);
    expect(view.invalidations).toEqual([
      ["my-themes", "me"],
      ["theme-marketplace"],
    ]);
    expect(view.render().publishAction?.props.disabled).toBe(false);
  });
}

test("failed publication preserves the state and displays the backend message", async () => {
  const view = settings({ fail: true });
  await view.render().custom.togglePublished(view.theme);
  expect(view.render().publishAction?.props.children).toContain(
    "Publish to marketplace",
  );
  expect(view.render().publishAction?.props.disabled).toBe(false);
  expect(view.invalidations).toEqual([]);
  expect(view.errors).toEqual([
    {
      message: "Couldn't publish the theme",
      options: { description: "Choose another theme name." },
    },
  ]);
});

test("someone else's theme card has no publish control", () => {
  expect(settings({ own: false }).render().publishAction).toBeUndefined();
});
