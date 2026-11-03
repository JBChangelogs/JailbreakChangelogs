import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { renderToStaticMarkup } from "react-dom/server";
import * as jsxRuntime from "react/jsx-runtime";
import type { ReactElement } from "react";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

test("only the duped count requires experiment access and unavailable counts stay distinct from zero", () => {
  const source = readFileSync(
    new URL("./ItemDetailsClient.tsx", import.meta.url),
    "utf8",
  );
  const start = source.indexOf("{currentItem.id !== 587 &&");
  const end = source.indexOf("{/* Mobile Ad", start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const compiled = transpileModule(
    `export default function Counts({ scanCount, dupedCopyCountsEnabled, currentItem }) {
      return <>${source.slice(start, end)}</>;
    }`,
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
  ).outputText;
  const exports = {} as { default: (props: object) => ReactElement };
  runInNewContext(compiled, {
    exports,
    require: () => jsxRuntime,
    Tooltip: ({ children }: { children: ReactElement }) => children,
    TooltipTrigger: ({ children }: { children: ReactElement }) => children,
    TooltipContent: ({ children }: { children: ReactElement }) =>
      jsxRuntime.jsx("aside", { children }),
    getUserAvatar: (id: string) => `/proxy/users/${id}/avatar-headshot`,
    UserAvatar: ({
      forceAvatarUrl,
      username,
    }: {
      forceAvatarUrl: string;
      username: string;
    }) => jsxRuntime.jsx("img", { src: forceAvatarUrl, alt: username }),
    Skeleton: () => jsxRuntime.jsx("span", { children: "Loading" }),
  });
  for (const enabled of [false, true]) {
    for (const scanCount of [
      undefined,
      null,
      { copyCount: 1234, dupedCopyCount: 0 },
      { copyCount: 10, dupedCopyCount: null },
      {
        copyCount: 10,
        dupedCopyCount: 0,
        signedCopyCount: 0,
        signedCounts: [],
      },
      {
        copyCount: 10,
        dupedCopyCount: 0,
        signedCopyCount: 2,
        signedCounts: [
          { sign: "epic_tank", count: 2 },
          { sign: "badcc", count: 1 },
          { sign: "asimo3089", count: 1 },
          { sign: "unknown", count: 1 },
        ],
      },
    ]) {
      const markup = renderToStaticMarkup(
        exports.default({
          scanCount,
          dupedCopyCountsEnabled: enabled,
          currentItem: { id: 49 },
        }),
      );
      expect(markup).toContain(enabled ? "sm:grid-cols-3" : "sm:grid-cols-2");
      expect(markup).toContain("grid-cols-1");
      expect(markup).toContain("justify-between gap-2");
      expect(markup).toContain("sm:block");
      expect(markup).not.toContain("border-b pb-3");
      expect(markup).not.toContain("<button");
      expect(markup).not.toContain(" title=");
      expect(markup).toContain("Inventory scans");
      expect(markup).toContain("Last 30 days");
      expect(markup).toContain(">Signed<");
      if (scanCount?.signedCounts?.length) {
        expect(markup).toContain("Copies by signer");
        expect(markup).toContain("epic_tank");
        expect(markup).toContain("badcc");
        expect(markup).toContain("2 copies signed by epic_tank");
        for (const id of [606723718, 2837719, 2025110]) {
          expect(markup).toContain(
            `href="https://www.roblox.com/users/${id}/profile"`,
          );
          expect(markup).toContain(`src="/proxy/users/${id}/avatar-headshot"`);
        }
        expect(markup).toContain("<span>unknown</span>");
        expect(markup).not.toContain("/undefined/profile");
        expect(markup).toContain(
          "Copies signed by multiple people count toward each signer.",
        );
      } else {
        expect(markup).not.toContain("Copies by signer");
      }
      if (scanCount?.signedCopyCount === 0) expect(markup).toContain(">0<");
      if (scanCount !== undefined && scanCount?.signedCopyCount == null)
        expect(markup).toContain("Signed unavailable");
      expect(markup.includes(">Duped<")).toBe(enabled);
      if (scanCount === undefined) expect(markup).toContain("Loading");
      else if (scanCount === null) expect(markup).toContain("unavailable");
      else if (enabled)
        expect(markup).toContain(
          scanCount.dupedCopyCount === 0 ? ">0<" : "Duped unavailable",
        );
    }
    expect(
      renderToStaticMarkup(
        exports.default({
          scanCount: null,
          dupedCopyCountsEnabled: enabled,
          currentItem: { id: 587 },
        }),
      ),
    ).toBe("");
  }
});
