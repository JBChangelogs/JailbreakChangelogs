import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { createElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleKind, transpileModule } from "typescript";
import { FRONTEND_SETTINGS } from "@/config/settings";

function render(mode: "sidebar" | "top-bar", largeScreen: boolean) {
  const imports: Record<string, unknown> = {
    react: {
      useId: () => "navigation-test",
      useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
    },
    "react/jsx-runtime": jsxRuntime,
    "@/config/settings": { FRONTEND_SETTINGS },
    "@/hooks/useMediaQuery": { useMediaQuery: () => largeScreen },
    "@/hooks/useExperimentAccess": { useExperimentAccess: () => false },
    "@/contexts/AuthContext": {
      useAuthContext: () => ({ isAuthenticated: true, user: { id: "user" } }),
    },
    "@/components/ui/switch": { Switch: () => null },
    "@/components/Settings/SettingsCard": { SETTING_HIGHLIGHT: "" },
    "@/utils/ui/desktopNavigation": {
      getDesktopNavigation: () => mode,
      getDesktopSidebarBehavior: () => "hover",
      getLayoutShortcutHidden: () => false,
    },
  };
  const exports = {} as { default: React.ComponentType };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./DesktopNavigationSettings.tsx", import.meta.url),
        "utf8",
      ),
      { compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 } },
    ).outputText,
    { exports, require: (id: string) => imports[id] },
  );
  return renderToStaticMarkup(createElement(exports.default));
}

test("sidebar settings show the three behavior choices with the saved hover selection", () => {
  const html = render("sidebar", true);
  expect(html).toContain("Always expanded");
  expect(html).toContain("Expand on hover");
  expect(html).toContain("Compact");
  expect(html).toMatch(/<input[^>]*checked=""[^>]*value="hover"/);
  expect(html).not.toContain('<fieldset disabled=""');
});

test("sidebar behavior controls stay disabled below the desktop breakpoint and hidden for top bar", () => {
  expect(render("sidebar", false)).toContain('<fieldset disabled=""');
  expect(render("top-bar", true)).not.toContain("Expand on hover");
});
