import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as calculations from "@/utils/items/hyperchrome";

type Element = { type: string; props: Record<string, unknown> };
function elements(value: unknown): Element[] {
  if (Array.isArray(value)) return value.flatMap(elements);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const element = value as Element;
  return [element, ...elements(element.props.children)];
}
function hasText(value: unknown, text: string): boolean {
  return elements(value).some((element) => element.props.children === text);
}

test("page separates information from calculator results while the sheet keeps one scrolling body", () => {
  const states: unknown[] = [true, "0", "0"];
  let stateIndex = 0;
  const exports = {} as { default: (props: { asPage: boolean }) => Element };
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./HyperchromeCalculatorSheet.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime")
          return { jsx, jsxs: jsx, Fragment: "fragment" };
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = stateIndex++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  states[index] = value;
                },
              ];
            },
            useEffect: () => {},
            useCallback: (callback: unknown) => callback,
          };
        if (name === "@/utils/items/hyperchrome") return calculations;
        if (name === "@/lib/utils")
          return {
            cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
          };
        return {
          default: name,
          Icon: "icon",
          Switch: "switch",
          Slider: "slider",
          Sheet: "sheet",
          SheetContent: "sheet-content",
        };
      },
    },
  );
  const render = (asPage: boolean) => {
    stateIndex = 0;
    return exports.default({ asPage });
  };
  const page = render(true);
  const [card, information] = page.props.children as Element[];
  expect(card.props.className).toContain("border-border-card");
  expect(hasText(card, "Result")).toBe(true);
  expect(hasText(card, "Pities and Chances")).toBe(false);
  expect(information.type).toBe("section");
  expect(hasText(information, "Pities and Chances")).toBe(true);
  const sheet = render(false);
  const scrollBody = elements(sheet).find((element) =>
    String(element.props.className).includes("overflow-y-auto"),
  )!;
  expect(hasText(scrollBody, "Result")).toBe(true);
  expect(hasText(scrollBody, "Pities and Chances")).toBe(true);
  states[0] = false;
  const skeletonChildren = render(true).props.children as Element[];
  expect(skeletonChildren[0].props.className).toContain("border-border-card");
  expect(skeletonChildren[1].props.className).not.toContain("border");
});
