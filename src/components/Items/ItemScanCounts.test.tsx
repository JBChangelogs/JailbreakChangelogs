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
    Skeleton: () => jsxRuntime.jsx("span", { children: "Loading" }),
  });
  for (const enabled of [false, true]) {
    for (const scanCount of [
      undefined,
      null,
      { copyCount: 1234, dupedCopyCount: 0 },
      { copyCount: 10, dupedCopyCount: null },
    ]) {
      const markup = renderToStaticMarkup(
        exports.default({
          scanCount,
          dupedCopyCountsEnabled: enabled,
          currentItem: { id: 49 },
        }),
      );
      expect(markup).toContain("Scanned copies · 30 days");
      expect(markup.includes("Duped copies seen · 30 days")).toBe(enabled);
      if (scanCount === undefined) expect(markup).toContain("Loading");
      else if (scanCount === null) expect(markup).toContain("unavailable");
      else if (enabled)
        expect(markup).toContain(
          scanCount.dupedCopyCount === 0
            ? ">0<"
            : "Duped copies seen · 30 days unavailable",
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
