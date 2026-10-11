import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { cn } from "@/lib/utils";

test("mobile context triggers preserve native text selection and desktop triggers retain actions", () => {
  let mobile = true;
  const exports = {} as {
    ContextMenuTrigger: (props: { disabled?: boolean }) => {
      props: { disabled?: boolean; style: { WebkitTouchCallout: string } };
    };
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./context-menu.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "@/lib/utils") return { cn };
        if (name === "react")
          return { forwardRef: (render: unknown) => render };
        if (name === "react/jsx-runtime")
          return { jsx: (type: unknown, props: unknown) => ({ type, props }) };
        if (name === "radix-ui")
          return {
            ContextMenu: {
              Trigger: "Trigger",
              Content: "Content",
              Item: "Item",
              Separator: "Separator",
            },
          };
        if (name === "@/hooks/useMediaQuery")
          return { useMediaQuery: () => mobile };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = (disabled?: boolean) =>
    exports.ContextMenuTrigger({ disabled }).props;
  expect(render().disabled).toBe(true);
  expect(render(false).disabled).toBe(true);
  expect(render().style.WebkitTouchCallout).toBe("default");
  mobile = false;
  expect(render().disabled).toBeUndefined();
  expect(render(false).disabled).toBe(false);
  expect(render(true).disabled).toBe(true);
});
