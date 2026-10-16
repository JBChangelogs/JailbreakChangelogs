import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import type { LoginModalController } from "./useLoginModalController";

type Element = { type: string; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}

test("login tabs follow authentication and Roblox linking state rather than leftover cookies", () => {
  let auth: Record<string, unknown> = {};
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
            };
          if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (name === "@/contexts/AuthContext")
            return { useAuthContext: () => auth };
          if (name === "@/contexts/ThemeContext")
            return { useTheme: () => ({ resolvedTheme: "dark" }) };
          if (name === "@/utils/api/api")
            return { PUBLIC_API_URL: "https://api.example.com" };
          if (name === "@/utils/api/apiDevToken" || name === "sonner")
            return {};
          if (name === "next/image") return { default: "Image" };
          return Object.fromEntries(
            [
              "Dialog",
              "DialogContent",
              "DialogTitle",
              "DialogDescription",
              "Tabs",
              "TabsList",
              "TabsTrigger",
              "TabsContent",
              "Button",
              "Checkbox",
              "Icon",
            ].map((key) => [key, key]),
          );
        },
      },
    );
  }
  for (const [isAuthenticated, user, onlyRoblox, expectedTabs, activeTab] of [
    [false, null, false, ["discord"], "discord"],
    [false, { roblox_id: "" }, true, ["discord"], "discord"],
    [true, null, false, ["discord"], "discord"],
    [true, { roblox_id: "" }, false, ["discord", "roblox"], "roblox"],
    [true, { roblox_id: "123" }, true, ["discord"], "discord"],
    [true, { roblox_id: "" }, true, ["roblox"], "roblox"],
  ] as const) {
    const changes: unknown[] = [];
    auth = {
      isAuthenticated,
      user,
      showLoginModal: true,
      loginModalTab: onlyRoblox ? "discord" : "roblox",
      loginModalOnlyRoblox: onlyRoblox,
      setLoginModal: (value: unknown) => changes.push(value),
    };
    const controller = controllerModule.useLoginModalController();
    const tree = elements(view.default(controller));
    expect(
      tree
        .filter((node) => node.type === "TabsTrigger")
        .map((node) => node.props.value),
    ).toEqual([...expectedTabs]);
    expect(
      tree
        .filter((node) => node.type === "TabsContent")
        .map((node) => node.props.value),
    ).toEqual([...expectedTabs]);
    expect(tree.find((node) => node.type === "Tabs")!.props.value).toBe(
      activeTab,
    );
    controller.handleTabChange({} as never, 1);
    expect(changes).toHaveLength(
      expectedTabs.some((tab) => tab === "roblox") ? 1 : 0,
    );
  }
});
