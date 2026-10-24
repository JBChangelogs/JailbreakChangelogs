import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import type { ReactElement } from "react";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as tabs from "@/components/ui/tabs";
import Link from "next/link";

test("one tracker row links all views and selects the current route", () => {
  const source = transpileModule(
    readFileSync(new URL("./TrackerSwitcher.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
  ).outputText;

  for (const [url, label] of [
    ["/robberies", "Robberies"],
    ["/robberies?airdrops", "Airdrops"],
    ["/bounties", "Bounties"],
    ["/bounties?airdrops", "Bounties"],
  ]) {
    const route = new URL(url, "https://example.com");
    const exports = {} as { default: (props: object) => ReactElement };
    runInNewContext(source, {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name === "next/link") return { default: Link };
        if (name === "@/components/ui/tabs") return tabs;
        if (name === "next/navigation")
          return {
            usePathname: () => route.pathname,
            useSearchParams: () => route.searchParams,
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    });
    const markup = renderToStaticMarkup(exports.default({}));
    const links = Array.from(
      markup.matchAll(/<a\b[^>]*>[^<]*<\/a>/g),
      ([link]) => link,
    );
    expect(links).toHaveLength(3);
    expect(
      links.find((link) => link.includes('data-state="active"')),
    ).toContain(`>${label}</a>`);
    for (const href of ["/robberies", "/robberies?airdrops", "/bounties"])
      expect(markup).toContain(`href="${href}"`);
  }
});
