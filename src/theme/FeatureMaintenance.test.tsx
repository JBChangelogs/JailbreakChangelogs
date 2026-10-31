import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsx from "react/jsx-runtime";
import type { ReactElement, ReactNode } from "react";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("maintenance views share styling and tools artwork with actions appropriate to the outage", () => {
  const exports = {} as { default: (props: object) => ReactElement };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./FeatureMaintenance.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return jsx;
        if (name === "next/link")
          return {
            default: ({
              children,
              href,
            }: {
              children: ReactNode;
              href: string;
            }) => jsx.jsx("a", { href, children }),
          };
        if (name === "@/components/ui/button")
          return {
            Button: ({ children }: { children: ReactNode }) =>
              jsx.jsx("div", { children }),
          };
        if (name === "@/components/ui/IconWrapper")
          return {
            Icon: ({ icon }: { icon: string }) =>
              jsx.jsx("span", { "data-icon": icon }),
          };
        if (name === "@/components/ui/tooltip") {
          const Wrapper = ({ children }: { children: ReactNode }) => children;
          return {
            Tooltip: Wrapper,
            TooltipTrigger: Wrapper,
            TooltipContent: Wrapper,
          };
        }
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  for (const siteWide of [false, true]) {
    const html = renderToStaticMarkup(
      exports.default({
        siteWide,
        featureName: siteWide ? "Under maintenance" : "Inventory Checker",
        customMessage: "Please check back soon.",
      }),
    );
    expect(html).toContain("Please check back soon.");
    expect(html).toContain("emojione-monotone:hammer-and-wrench");
    expect(html).not.toContain("cog-filled-loop");
    expect(html).toContain("https://discord.jailbreakchangelogs.com");
    expect(html).toContain("https://x.com/JBChangelogs");
    expect(html).toContain("Follow us on X (Twitter)");
    expect(html).toContain("Join our Discord server");
    expect(html).toContain("Join our Roblox group");
    expect(
      html.includes("Other features of the site are still available."),
    ).toBe(!siteWide);
    expect(html.includes("Take me home")).toBe(!siteWide);
    expect(html.includes("Go back")).toBe(!siteWide);
    expect(html.includes("https://status.jailbreakchangelogs.com")).toBe(
      siteWide,
    );
  }
  expect(
    renderToStaticMarkup(exports.default({ featureName: "OG Finder" })),
  ).toContain("The OG Finder is temporarily unavailable");
});
