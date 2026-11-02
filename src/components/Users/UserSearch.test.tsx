import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { isValidElement, type ReactNode } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { isItemSearchShortcut } from "@/utils/ui/searchShortcut";
import type UserSearch from "./UserSearch";

test("users search registers slash to focus and select, then cleans up", () => {
  const effects: (() => unknown)[] = [];
  const listeners = new Map<string, (event: KeyboardEvent) => void>();
  const parser = { withDefault: () => parser };
  const exports = {} as { default: typeof UserSearch };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./UserSearch.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      window: {
        addEventListener: (
          type: string,
          listener: (event: KeyboardEvent) => void,
        ) => listeners.set(type, listener),
        removeEventListener: (
          type: string,
          listener: (event: KeyboardEvent) => void,
        ) => {
          expect(listeners.get(type)).toBe(listener);
          listeners.delete(type);
        },
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (value: unknown) => [value, () => {}],
            useRef: (value: unknown) => ({ current: value }),
            useEffect: (effect: () => unknown) => effects.push(effect),
          };
        if (name === "react/jsx-runtime") return jsxRuntime;
        if (name === "nuqs")
          return {
            parseAsString: parser,
            parseAsInteger: parser,
            useQueryStates: () => [
              { query: "", page: 1, seed: null },
              () => {},
            ],
          };
        if (name === "@tanstack/react-query") return { useQuery: () => ({}) };
        if (name === "@/hooks/useDebounce")
          return { useDebounce: (value: unknown) => value };
        if (name === "@/utils/ui/searchShortcut")
          return { isItemSearchShortcut };
        return {};
      },
    },
  );
  type Props = {
    children?: ReactNode;
    ref?: { current: unknown };
    "aria-keyshortcuts"?: string;
  };
  function findInput(node: ReactNode): Props | undefined {
    if (Array.isArray(node)) return node.map(findInput).find(Boolean);
    if (!isValidElement<Props>(node)) return;
    return node.type === "input" ? node.props : findInput(node.props.children);
  }
  const input = findInput(exports.default())!;
  expect(input["aria-keyshortcuts"]).toBe("/");
  const calls: string[] = [];
  input.ref!.current = {
    focus: () => calls.push("focus"),
    select: () => calls.push("select"),
  };
  const cleanups = effects.map((effect) => effect());
  const dispatch = (overrides = {}) =>
    listeners.get("keydown")!({
      key: "/",
      preventDefault: () => calls.push("preventDefault"),
      ...overrides,
    } as unknown as KeyboardEvent);
  dispatch();
  expect(calls).toEqual(["preventDefault", "focus", "select"]);
  calls.length = 0;
  dispatch({ target: { closest: () => ({}) } });
  dispatch({ ctrlKey: true });
  expect(calls).toEqual([]);
  for (const cleanup of cleanups) if (typeof cleanup === "function") cleanup();
  expect(listeners.size).toBe(0);
});
