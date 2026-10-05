import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleKind, transpileModule } from "typescript";
import { canOverrideExperiments } from "@/utils/api/experiments";

test("mobile tools start collapsed and retain owner and tester access", () => {
  // Isolate the drawer from the header's network and authentication effects.
  const source = readFileSync(new URL("./Header.tsx", import.meta.url), "utf8");
  const drawer = source.slice(
    source.indexOf("const MobileDrawer ="),
    source.indexOf("export default function Header()"),
  );
  const component = runInNewContext(
    transpileModule(drawer, {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: 4 },
    }).outputText + ";MobileDrawer;",
    {
      exports: {},
      require: () => jsxRuntime,
      memo: React.memo,
      useAuthContext: () => ({ setLoginModal() {} }),
      usePathname: () => "/seasons",
      getNavigationHref: () => "/seasons",
      canOverrideExperiments,
      navigationSections: [],
      Link: ({
        href,
        children,
      }: {
        href: string;
        children: React.ReactNode;
      }) => <a href={href}>{children}</a>,
      UserAvatar: () => null,
      Icon: () => null,
      Spinner: () => null,
    },
  );

  for (const [flag, enabled, label] of [
    ["is_owner", true, "Owner tools"],
    ["is_tester", true, "Tester tools"],
    ["is_tester", false, null],
    ["regular", true, null],
  ] as const) {
    const markup = renderToStaticMarkup(
      React.createElement(component, {
        userData: {
          id: "1",
          username: "Player",
          roblox_id: "2",
          flags: [{ flag, enabled }],
        },
        wsConnected: true,
      }),
    );
    const tools = markup.match(/<details\b[^>]*>.*?<\/details>/s)?.[0];
    if (label) {
      expect(tools).toContain(label);
      expect(tools).not.toMatch(/<details\b[^>]*\bopen(?:\s|=|>)/);
      expect(tools).toContain("Experiments");
      expect(tools?.includes("Realtime connection")).toBe(flag === "is_owner");
      expect(tools?.includes("Generate UTM Link")).toBe(flag === "is_owner");
    } else {
      expect(tools).toBeUndefined();
      expect(markup).not.toContain("Experiments");
    }
    const account = markup.replace(tools ?? "", "");
    for (const action of ["Settings", "My Reports", "Logout"]) {
      expect(account).toContain(action);
    }
  }
});
