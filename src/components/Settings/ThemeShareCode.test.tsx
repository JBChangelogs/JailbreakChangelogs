import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

interface Node {
  type: string;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

const code = transpileModule(
  readFileSync(new URL("./ThemeShareCode.tsx", import.meta.url), "utf8"),
  { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } },
).outputText;

function copyButton({ clipboardError = false } = {}) {
  const copied: string[] = [];
  const errors: unknown[] = [];
  const exports = {} as { default: (props: { code: string }) => unknown };
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  runInNewContext(code, {
    exports,
    navigator: {
      clipboard: {
        writeText: async (value: string) => {
          if (clipboardError) throw new Error("Clipboard unavailable");
          copied.push(value);
        },
      },
    },
    require: (name: string) => {
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "sonner")
        return {
          toast: {
            success: () => {},
            error: (_title: string, detail: unknown) => errors.push(detail),
          },
        };
      if (name === "@/components/ui/IconWrapper") return { Icon: "Icon" };
      if (name === "@/lib/utils")
        return { cn: (...classes: string[]) => classes.join(" ") };
      if (name === "@/components/ui/tooltip")
        return {
          Tooltip: "Tooltip",
          TooltipContent: "TooltipContent",
          TooltipTrigger: "TooltipTrigger",
        };
      throw new Error(`Unexpected import: ${name}`);
    },
  });
  const button = nodes(exports.default({ code: "ABCDEFGH" })).find(
    (node) => node.props["aria-label"] === "Copy share code ABCDEFGH",
  )!;
  return {
    click: () => (button.props.onClick as () => Promise<void>)(),
    button,
    copied,
    errors,
  };
}

test("clicking the share code copies it, above the card's link", async () => {
  const view = copyButton();
  expect(view.button.props.className).toContain("relative z-10");
  await view.click();
  expect(view.copied).toEqual(["ABCDEFGH"]);
});

test("clipboard failures keep the share code available in the error", async () => {
  const view = copyButton({ clipboardError: true });
  await view.click();
  expect(view.errors).toEqual([{ description: "ABCDEFGH" }]);
});
