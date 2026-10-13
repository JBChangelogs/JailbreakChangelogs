import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import Link from "next/link";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import ExplorePageLinks from "@/components/Layout/ExplorePageLinks";
import { Button } from "@/components/ui/button";
import type { ReactElement } from "react";

test("personal actions stay prominent, respect account state, and avoid self-links", () => {
  let isAuthenticated = true;
  let robloxId: string | undefined = "123";
  let pathname = "/inventories";
  let loginConfig: unknown;
  const exports = {} as {
    default: (props: {
      current: "inventories" | "og" | "dupes";
    }) => ReactElement;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./RelatedInventoryPages.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name === "next/link") return { default: Link };
        if (name === "next/navigation") return { usePathname: () => pathname };
        if (name === "@/components/ui/button") return { Button };
        if (name === "@/components/Layout/ExplorePageLinks")
          return { default: ExplorePageLinks };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              isAuthenticated,
              user: { roblox_id: robloxId },
              setLoginModal: (config: unknown) => {
                loginConfig = config;
              },
            }),
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = (current: "inventories" | "og" | "dupes" = "inventories") =>
    renderToStaticMarkup(exports.default({ current }));
  const inventory = render();
  expect(inventory).toMatch(
    /<a[^>]*class="[^"]*bg-button-info[^>]*>View My Inventory<\/a>/,
  );
  expect(inventory).toMatch(
    /<a[^>]*class="[^"]*bg-button-secondary[^>]*>View My OG Items<\/a>/,
  );
  expect(inventory.indexOf("View My Inventory")).toBeLessThan(
    inventory.indexOf("Explore:"),
  );
  expect(inventory).toContain('href="/dupes"');
  expect(inventory).not.toContain('href="/inventories"');
  expect(render("og")).toMatch(
    /<a[^>]*class="[^"]*bg-button-info[^>]*>View My OG Items<\/a>/,
  );
  expect(render("og").indexOf("View My OG Items")).toBeLessThan(
    render("og").indexOf("View My Inventory"),
  );
  for (const current of ["inventories", "og", "dupes"] as const) {
    for (const suffix of ["", "/456"]) {
      pathname = `/${current}${suffix}`;
      const markup = render(current);
      expect(markup).toContain('href="/inventories/123"');
      expect(markup).toContain('href="/og/123"');
      expect(markup).not.toContain(`href="/${current}"`);
      expect(markup.indexOf("View My Inventory")).toBeLessThan(
        markup.indexOf("Explore:"),
      );
    }
  }
  pathname = "/inventories/123";
  expect(render()).not.toContain("View My Inventory");
  expect(render()).toMatch(
    /<a[^>]*class="[^"]*bg-button-info[^>]*>View My OG Items<\/a>/,
  );
  pathname = "/og/123";
  expect(render("og")).not.toContain("View My OG Items");
  expect(render("og")).toMatch(
    /<a[^>]*class="[^"]*bg-button-info[^>]*>View My Inventory<\/a>/,
  );
  robloxId = undefined;
  expect(render()).toContain("Connect Roblox Account");
  const tree = exports.default({ current: "inventories" });
  const children = (tree.props as { children: ReactElement[] }).children;
  (children[1].props as { onClick: () => void }).onClick();
  expect(loginConfig).toEqual({ open: true, tab: "roblox" });
  expect(render("og")).not.toContain("Connect Roblox Account");
  isAuthenticated = false;
  expect(render()).not.toContain("Connect Roblox Account");
  expect(render()).not.toContain("View My Inventory");
});
