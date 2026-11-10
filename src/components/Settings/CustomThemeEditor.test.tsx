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
  collapsed = true,
  published = false,
  description = null as string | null,
  vars = {
    "--color-primary-bg": "#111111",
    "--color-secondary-bg": "#222222",
  } as Record<string, string>,
} = {}) {
  const saved: UserTheme = {
    id: 1,
    share_code: "K7QM4XRP",
    label: "Mine",
    description,
    scheme: "dark",
    vars,
    logo_filter: null,
    published_at: published ? 123 : null,
  };
  const states: unknown[] = [];
  let cursor = 0;
  const applied: UserTheme[] = [];
  const savedEvents: UserTheme[] = [];
  const closedEvents: string[] = [];
  const requests: string[] = [];
  const inputs: Record<string, unknown>[] = [];
  const errors: string[] = [];
  const scrolls: string[] = [];
  const timers: (() => void)[] = [];
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
      setTimeout: (callback: () => void) => timers.push(callback),
      document: {
        createElement: () => ({ getContext: () => null }),
        getElementById: (id: string) => ({
          scrollIntoView: () => scrolls.push(id),
        }),
      },
      require: (name: string) => {
        if (name === "next/link") return { default: "Link" };
        if (name === "radix-ui")
          return { Popover: { Anchor: "PopoverAnchor" } };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: (current: unknown) => {
              const index = cursor++;
              states[index] ??= { current };
              return states[index];
            },
            useEffect: () => {},
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states))
                states[index] =
                  typeof initial === "function" ? initial() : initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] =
                    typeof value === "function" ? value(states[index]) : value;
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
            createMyTheme: (input: Record<string, unknown>) => {
              inputs.push(input);
              return persist("create");
            },
            updateMyTheme: (_id: number, input: Record<string, unknown>) => {
              inputs.push(input);
              return persist("update");
            },
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
              collapsed,
              sheet: { side: "right" },
            }),
            useDesktopDock: () => ({ side: "right", minimized: false }),
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
        onClose: (reason: string) => closedEvents.push(reason),
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
  return {
    saved,
    applied,
    savedEvents,
    closedEvents,
    requests,
    inputs,
    errors,
    prompt,
    save,
    render,
    scrolls,
    flushTimers: () => timers.splice(0).forEach((callback) => callback()),
  };
}

for (const published of [false, true]) {
  test(`publish toggle loads ${published ? "public" : "private"} state and saves a change`, async () => {
    const view = editor({ existing: true, collapsed: false, published });
    const toggle = view
      .render()
      .find((node) => node.props.id === "publish-theme")!;
    expect(toggle.props.checked).toBe(published);
    (toggle.props.onCheckedChange as (value: boolean) => void)(!published);
    expect(
      view.render().find((node) => node.props.id === "publish-theme")!.props
        .checked,
    ).toBe(!published);
    (
      view.render().find((node) => node.type === "Sheet")!.props
        .onOpenChange as (open: boolean) => void
    )(false);
    expect(
      view.render().find((node) => node.type === "Dialog")!.props.open,
    ).toBe(true);
    await view.save();
    expect(view.inputs[0].published).toBe(!published);
  });
}

test("screenshots update the saved theme without saving draft colors and block concurrent saves", async () => {
  const view = editor({ existing: true, collapsed: false });
  const upload = () =>
    view
      .render()
      .find((node) => node.type === "default" && node.props.onBusyChange)!;
  const props = upload().props;
  (props.onBusyChange as (busy: boolean) => void)(true);
  await view.save();
  expect(view.requests).toEqual([]);
  const previews = [
    {
      id: "abc",
      url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/abc.webp",
      kind: "desktop" as const,
    },
  ];
  (props.onChange as (previews: unknown) => void)(previews);
  (props.onBusyChange as (busy: boolean) => void)(false);
  expect(view.savedEvents[0].previews).toEqual(previews);
  expect((upload().props.theme as UserTheme).previews).toEqual(previews);
  expect(view.requests).toEqual([]);
});

test("description loads, counts characters, saves edits, and can be cleared", async () => {
  const view = editor({
    existing: true,
    collapsed: false,
    description: "Soft accents",
  });
  const field = () =>
    view.render().find((node) => node.props.id === "theme-description")!.props;
  expect(field().value).toBe("Soft accents");
  expect(field().maxLength).toBe(500);
  (field().onChange as (event: unknown) => void)({
    target: { value: "x".repeat(500) },
  });
  expect(
    view.render().find((node) => node.props.id === "theme-description-count")!
      .props.children,
  ).toEqual([500, "/500"]);
  await view.save();
  expect(view.inputs[0].description).toBe("x".repeat(500));
  (field().onChange as (event: unknown) => void)({ target: { value: "" } });
  await view.save();
  expect(view.inputs[1].description).toBe("");
});

for (const mobile of [true, false]) {
  test(`${mobile ? "mobile" : "desktop"} preview picks open an inline color bubble without scrolling or filtering the grid`, () => {
    const view = editor({ mobile, collapsed: false });
    let rect = { top: 420, bottom: 452, left: 100, right: 180 };
    const element = { getBoundingClientRect: () => rect } as Element;
    const pick = (keys: string[]) => {
      const preview = view.render().find((node) => node.props.onPick)!;
      (preview.props.onPick as (keys: string[], element: Element) => void)(
        keys,
        element,
      );
    };
    const bubble = () => view.render().find((node) => node.type === "Popover")!;
    const control = () => view.render().find((node) => node.props.inline)!;
    const gridCount = () =>
      view
        .render()
        .filter((node) => "colorKey" in node.props && !node.props.inline)
        .length;
    const initialCount = gridCount();
    expect(bubble().props.open).toBe(false);
    expect(
      view.render().find((node) => node.props.onPick)!.props.hideTooltips,
    ).toBe(false);
    pick(["--unknown"]);
    expect(bubble().props.open).toBe(false);
    pick(["--color-primary-bg", "--color-secondary-bg", "--unknown"]);
    expect(bubble().props.open).toBe(true);
    expect(
      view.render().find((node) => node.props.onPick)!.props.hideTooltips,
    ).toBe(true);
    expect(control().props.colorKey).toBe("--color-primary-bg");
    expect(control().props.canReset).toBe(false);
    const anchor = view.render().find((node) => node.type === "PopoverAnchor")!;
    const virtual = (
      anchor.props.virtualRef as {
        current: {
          getBoundingClientRect: () => unknown;
          contextElement: Element;
        };
      }
    ).current;
    expect(virtual.contextElement).toBe(element);
    expect(virtual.getBoundingClientRect()).toBe(rect);
    rect = { ...rect, top: 320, bottom: 352 };
    expect(virtual.getBoundingClientRect()).toBe(rect);
    expect(gridCount()).toBe(initialCount);
    view.flushTimers();
    expect(view.scrolls).toEqual([]);

    (control().props.onChange as (value: string) => void)("#abcdef");
    expect(control().props.value).toBe("#abcdef");
    expect(control().props.canReset).toBe(true);
    const colors = view
      .render()
      .find(
        (node) =>
          node.type === "DropdownMenuRadioGroup" &&
          node.props.value === "--color-primary-bg",
      )!;
    expect(
      view
        .render()
        .filter(
          (node) =>
            node.type === "DropdownMenuRadioItem" &&
            [
              "--color-primary-bg",
              "--color-secondary-bg",
              "--unknown",
            ].includes(node.props.value as string),
        ),
    ).toHaveLength(2);
    (colors.props.onValueChange as (key: string) => void)(
      "--color-secondary-bg",
    );
    expect(control().props.colorKey).toBe("--color-secondary-bg");
    const outside = (selectable: boolean) => {
      let prevented = false;
      const content = view
        .render()
        .find((node) => node.type === "PopoverContent")!;
      (content.props.onInteractOutside as (event: unknown) => void)({
        target: {
          closest: (selector: string) => {
            expect(selector).toBe("[data-theme-color-preview] [data-color]");
            return selectable ? element : null;
          },
        },
        preventDefault: () => {
          prevented = true;
        },
      });
      if (!prevented)
        (bubble().props.onOpenChange as (open: boolean) => void)(false);
      return prevented;
    };
    // Mouse dismissal precedes the pick; touch dismissal can follow the click.
    expect(outside(true)).toBe(true);
    expect(bubble().props.open).toBe(true);
    pick(["--color-primary-bg"]);
    expect(control().props.colorKey).toBe("--color-primary-bg");
    pick(["--color-secondary-bg"]);
    expect(outside(true)).toBe(true);
    expect(bubble().props.open).toBe(true);
    expect(control().props.colorKey).toBe("--color-secondary-bg");
    expect(outside(false)).toBe(false);
    expect(bubble().props.open).toBe(false);
    expect(
      view.render().find((node) => node.props.onPick)!.props.hideTooltips,
    ).toBe(false);
    pick(["--color-primary-bg"]);
    (bubble().props.onOpenChange as (open: boolean) => void)(false);
    expect(bubble().props.open).toBe(false);
    pick(["--color-primary-bg"]);
    expect(control().props.value).toBe("#abcdef");
    (control().props.onReset as () => void)();
    expect(control().props.value).toBe("#111111");
    expect(control().props.canReset).toBe(false);
    expect(
      (control().props.vars as Record<string, string>)["--color-secondary-bg"],
    ).toBe("#222222");
  });
}

for (const original of [
  "rgb(255 165 0 / 50%)",
  "linear-gradient(to right, #ffa500, #ff0000)",
  "var(--color-secondary-bg)",
]) {
  test(`reset restores the exact original ${original} without reverting other colors`, async () => {
    const view = editor({
      existing: true,
      collapsed: false,
      vars: {
        "--color-primary-bg": original,
        "--color-secondary-bg": "#222222",
      },
    });
    const color = (key: string) =>
      view.render().find((node) => node.props.colorKey === key)!.props;
    (color("--color-primary-bg").onChange as (value: string) => void)(
      "#abcdef",
    );
    (color("--color-secondary-bg").onChange as (value: string) => void)(
      "#123456",
    );
    (color("--color-primary-bg").onReset as () => void)();
    expect(color("--color-primary-bg").value).toBe(original);
    expect(color("--color-secondary-bg").value).toBe("#123456");
    await view.save();
    (color("--color-secondary-bg").onChange as (value: string) => void)(
      "#abcdef",
    );
    (color("--color-secondary-bg").onReset as () => void)();
    expect(color("--color-secondary-bg").value).toBe("#123456");
  });
}

test("an unchanged main color disables reset and leaves its saved hover color unchanged", () => {
  const view = editor({
    collapsed: false,
    vars: {
      "--color-link": "#123456",
      "--color-link-hover": "#abcdef",
    },
  });
  const link = () =>
    view.render().find((node) => node.props.colorKey === "--color-link")!.props;
  expect(link().canReset).toBe(false);
  expect((link().vars as Record<string, string>)["--color-link-hover"]).toBe(
    "#abcdef",
  );
});

for (const independentEdit of [false, true]) {
  test(`reset restores automatic color changes and ${independentEdit ? "keeps a separate edit dirty" : "closes without a discard prompt"}`, () => {
    const view = editor({
      collapsed: false,
      vars: {
        "--color-button-info": "#123456",
        "--color-button-info-hover": "#345678",
        "--color-button-info-active": "#456789",
        "--color-border-focus": "#56789a",
      },
    });
    const color = () =>
      view
        .render()
        .find((node) => node.props.colorKey === "--color-button-info")!.props;
    (color().onChange as (value: string) => void)("#abcdef");
    if (independentEdit) {
      const preview = view.render().find((node) => node.props.onPick)!;
      (preview.props.onPick as (keys: string[], element: Element) => void)(
        ["--color-button-info-hover"],
        { getBoundingClientRect: () => ({}) } as Element,
      );
      const control = view.render().find((node) => node.props.inline)!;
      (control.props.onChange as (value: string) => void)("#fedcba");
    }
    (color().onReset as () => void)();
    const vars = color().vars as Record<string, string>;
    expect(vars["--color-button-info-hover"]).toBe(
      independentEdit ? "#fedcba" : "#345678",
    );
    expect(vars["--color-button-info-active"]).toBe("#456789");
    expect(vars["--color-border-focus"]).toBe("#56789a");
    (
      view.render().find((node) => node.type === "Sheet")!.props
        .onOpenChange as (open: boolean) => void
    )(false);
    expect(view.closedEvents).toEqual(independentEdit ? [] : ["cancelled"]);
    expect(
      view.render().find((node) => node.type === "Dialog")!.props.open,
    ).toBe(independentEdit);
  });
}

test("a new theme starts with an empty name field and saves a typed name", async () => {
  const view = editor({ collapsed: false });
  const field = view
    .render()
    .find((node) => node.props.placeholder === "My theme")!.props;
  expect(field.value).toBe("");
  (field.onChange as (event: unknown) => void)({
    target: { value: "Monochrome" },
  });
  await view.save();
  expect(view.inputs[0].label).toBe("Monochrome");
});

test("saving a new desktop theme asks before applying and Not now leaves it inactive", async () => {
  const view = editor();
  await view.save();
  expect(view.requests).toEqual(["create"]);
  expect(view.inputs[0].label).toBe("My theme");
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

test("menu badges follow button and link palette edits while preserving separate badge edits", () => {
  const view = editor({
    collapsed: false,
    vars: {
      "--color-button-info": "#0000ff",
      "--color-link": "#0088ff",
      "--color-menu-badge-bg": "#001133",
      "--color-menu-badge-text": "#0088ff",
    },
  });
  const color = (key: string) =>
    view.render().find((node) => node.props.colorKey === key)!.props;
  (color("--color-button-info").onChange as (value: string) => void)("#ff6600");
  (color("--color-link").onChange as (value: string) => void)("#ff8800");
  const vars = () => color("--color-link").vars as Record<string, string>;
  expect(vars()["--color-menu-badge-bg"]).toBe(
    "color-mix(in srgb, var(--color-button-info) 20%, transparent)",
  );
  expect(vars()["--color-menu-badge-text"]).toBe("var(--color-link)");
  const selectGroup = (group: string) => {
    const menu = view
      .render()
      .find(
        (node) =>
          node.type === "DropdownMenuRadioGroup" &&
          ["Main", "Icons and menu badges"].includes(String(node.props.value)),
      )!;
    (menu.props.onValueChange as (value: string) => void)(group);
  };
  selectGroup("Icons and menu badges");
  (color("--color-menu-badge-text").onChange as (value: string) => void)(
    "#ffffff",
  );
  selectGroup("Main");
  (color("--color-link").onChange as (value: string) => void)("#ff0000");
  expect(vars()["--color-menu-badge-text"]).toBe("#ffffff");
});
