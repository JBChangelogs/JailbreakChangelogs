import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type SiteLogo from "./SiteLogo";

type Node = { type: unknown; props: Record<string, unknown> };
let resolvedTheme = "dark";
const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
const exports = {} as { default: typeof SiteLogo };
runInNewContext(
  transpileModule(
    readFileSync(new URL("./SiteLogo.tsx", import.meta.url), "utf8"),
    { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
  ).outputText,
  {
    exports,
    require: (name: string) => {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/image") return { default: "img" };
      if (name === "@/contexts/ThemeContext")
        return { useTheme: () => ({ resolvedTheme }) };
      return { cn: (...values: unknown[]) => values.filter(Boolean).join(" ") };
    },
  },
);

test("regular logo uses the optimized artwork and preserves image sizing and priority", () => {
  const logo = exports.default({
    alt: "JBCL",
    width: 256,
    height: 58,
    className: "h-9 w-auto",
    loading: "eager",
    fetchPriority: "high",
  }) as unknown as Node;
  expect(logo.type).toBe("img");
  expect(logo.props).toMatchObject({
    src: "/logos/JBCL_Header.webp",
    alt: "JBCL",
    width: 256,
    height: 58,
    className: "h-9 w-auto header-logo",
    loading: "eager",
    fetchPriority: "high",
  });
});

test("collaboration logo keeps the partner unfiltered and uses a decorative clipped overlay", () => {
  for (const tone of ["dark", "light"]) {
    resolvedTheme = tone;
    const logo = exports.default({
      collaboration: true,
      alt: "JBCL x Trading Core",
      width: 148,
      height: 48,
      className: "h-12 w-auto",
    }) as unknown as Node;
    const [base, overlay] = logo.props.children as Node[];
    expect(base.props.src).toBe(
      `/logos/collab/JBCL_Collab_${tone === "dark" ? "Dark" : "Light"}.webp`,
    );
    expect(base.props.className).toBe(
      "h-12 w-auto [clip-path:inset(0_0_0_35%)]",
    );
    expect(base.props.alt).toBe("JBCL x Trading Core");
    expect(overlay.props.src).toBe(base.props.src);
    expect(overlay.props).toMatchObject({
      fill: true,
      alt: "",
      "aria-hidden": "true",
      className: "header-logo pointer-events-none [clip-path:inset(0_65%_0_0)]",
    });
  }
});
