import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { UserTheme } from "@/utils/api/userThemes";
import * as themeColors from "@/utils/ui/themeColors";
import * as themeCss from "@/utils/ui/themeCss";
import { cn } from "@/lib/utils";

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

function editor({
  mobile = false,
  existing = false,
  active = false,
  fail = false,
} = {}) {
  const saved: UserTheme = {
    id: 1,
    share_code: "K7QM4XRP",
    label: "Mine",
    scheme: "dark",
    vars: { "--color-primary-bg": "#111111" },
    logo_filter: null,
  };
  const states: unknown[] = [];
  let cursor = 0;
  const applied: UserTheme[] = [];
  const savedEvents: UserTheme[] = [];
  const requests: string[] = [];
  const errors: string[] = [];
  const exports = {} as { default: (props: unknown) => Node };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const persist = async (method: string) => {
    requests.push(method);
    if (fail) throw new Error("Save failed");
    return saved;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./CustomThemeEditor.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: (current: unknown) => ({ current }),
            useEffect: () => {},
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states))
                states[index] =
                  typeof initial === "function" ? initial() : initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
          };
        if (name === "@tanstack/react-query")
          return {
            useQuery: ({ queryKey }: { queryKey: string[] }) => ({
              data:
                queryKey[0] === "site-themes"
                  ? [{ slug: "dark", ...saved }]
                  : undefined,
            }),
          };
        if (name === "sonner")
          return {
            toast: {
              success: () => {},
              error: (message: string) => errors.push(message),
            },
          };
        if (name === "@/contexts/ThemeContext")
          return { useTheme: () => ({ theme: "dark", customTheme: null }) };
        if (name === "@/contexts/AuthContext")
          return { useAuthContext: () => ({ user: { id: "1" } }) };
        if (name === "@/utils/ui/themeColors") return themeColors;
        if (name === "@/utils/ui/themeCss") return themeCss;
        if (name === "@/lib/utils") return { cn };
        if (name === "@/utils/api/userThemes")
          return {
            createMyTheme: () => persist("create"),
            updateMyTheme: () => persist("update"),
            ThemeApiError: class extends Error {},
          };
        if (name === "@/utils/ui/customTheme")
          return {
            getCustomTheme: () => (active ? saved : null),
            setCustomTheme: (theme: UserTheme) => applied.push(theme),
          };
        if (name === "@/components/ui/bottom-panel")
          return {
            useBottomPanel: () => ({
              isMobile: mobile,
              collapsed: true,
              sheet: { side: "right" },
            }),
            BottomPanelHeader: "BottomPanelHeader",
            BottomPanelFooter: "BottomPanelFooter",
          };
        if (name.startsWith("@/components/"))
          return new Proxy({}, { get: (_target, key) => String(key) });
        if (name === "@/utils/ui/elementColors") return {};
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = () => {
    cursor = 0;
    return nodes(
      exports.default({
        theme: existing ? saved : undefined,
        open: true,
        onClose: () => {},
        onSaved: (theme: UserTheme) => savedEvents.push(theme),
      }),
    );
  };
  const prompt = () =>
    render().find((node) => node.type === "ConfirmDialog")!.props;
  const save = async () => {
    const button = render().find(
      (node) => node.type === "Button" && node.props.children === "Save",
    )!;
    (button.props.onClick as () => void)();
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { saved, applied, savedEvents, requests, errors, prompt, save };
}

test("saving a new desktop theme asks before applying and Not now leaves it inactive", async () => {
  const view = editor();
  await view.save();
  expect(view.requests).toEqual(["create"]);
  expect(view.savedEvents).toEqual([view.saved]);
  expect(view.applied).toEqual([]);
  expect(view.prompt().isOpen).toBe(true);
  expect(view.prompt().confirmText).toBe("Apply theme");
  expect(view.prompt().cancelText).toBe("Not now");
  (view.prompt().onClose as () => void)();
  expect(view.prompt().isOpen).toBe(false);
  expect(view.applied).toEqual([]);
});

test("saving an inactive mobile theme applies only after confirmation", async () => {
  const view = editor({ mobile: true, existing: true });
  await view.save();
  expect(view.requests).toEqual(["update"]);
  expect(view.applied).toEqual([]);
  (view.prompt().onConfirm as () => void)();
  expect(view.applied).toEqual([view.saved]);
});

test("saving an active theme updates it without an unnecessary apply prompt", async () => {
  const view = editor({ existing: true, active: true });
  await view.save();
  expect(view.applied).toEqual([view.saved]);
  expect(view.prompt().isOpen).toBe(false);
});

test("a failed save neither applies nor offers to apply a theme", async () => {
  const view = editor({ fail: true });
  await view.save();
  expect(view.applied).toEqual([]);
  expect(view.savedEvents).toEqual([]);
  expect(view.prompt().isOpen).toBe(false);
  expect(view.errors).toEqual(["Couldn't save your theme"]);
});
