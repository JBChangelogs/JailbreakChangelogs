import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleKind, transpileModule } from "typescript";
import { canOverrideExperiments } from "@/utils/api/experiments";

test("owners get an Experiments link in the mobile drawer", () => {
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
      canOverrideExperiments,
    },
  );

  for (const flag of ["is_owner", "regular"]) {
    const markup = renderToStaticMarkup(
      React.createElement(component, {
        userData: {
          id: "1",
          username: "Player",
          roblox_id: "2",
          flags: [{ flag, enabled: true }],
        },
      }),
    );
    expect(markup.includes("Experiments")).toBe(flag === "is_owner");
    for (const removed of [
      "Owner tools",
      "Realtime connection",
      "Generate UTM Link",
    ]) {
      expect(markup).not.toContain(removed);
    }
    for (const action of ["Settings", "My Reports", "Logout"]) {
      expect(markup).toContain(action);
    }
  }
});
