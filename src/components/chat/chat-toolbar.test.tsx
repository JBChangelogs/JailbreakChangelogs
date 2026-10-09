import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { cn } from "@/lib/utils";

test("desktop Enter sends; mobile Enter, Shift+Enter, IME composition and handled events do not", () => {
  type Node = { type: string; props: Record<string, unknown> };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const exports = {} as {
    ChatToolbarTextarea: (props: Record<string, unknown>) => Node;
  };
  const react = {
    useRef: (current: unknown) => ({ current }),
    useState: (initial: unknown) => [initial, () => {}],
    useLayoutEffect: () => {},
    useCallback: (callback: unknown) => callback,
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./chat-toolbar.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react") return react;
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/lib/utils") return { cn };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  let sends = 0;
  const handler = (submitOnEnter: boolean, autocomplete: boolean) => {
    const root = exports.ChatToolbarTextarea({
      onSubmit: () => sends++,
      submitOnEnter,
      emojiMap: autocomplete ? { smile: "🙂" } : undefined,
    });
    const grid = (root.props.children as Node[])[1];
    const textarea = (grid.props.children as Node[])[0];
    return textarea.props.onKeyDown as (event: {
      key: string;
      shiftKey: boolean;
      defaultPrevented: boolean;
      nativeEvent: { isComposing: boolean };
      preventDefault: () => void;
    }) => void;
  };
  for (const autocomplete of [false, true]) {
    let prevented = false;
    const event = {
      key: "Enter",
      shiftKey: false,
      defaultPrevented: false,
      nativeEvent: { isComposing: false },
      preventDefault: () => {
        prevented = true;
      },
    };
    const desktop = handler(true, autocomplete);
    const before = sends;
    desktop(event);
    expect(sends).toBe(before + 1);
    expect(prevented).toBe(true);
    prevented = false;
    handler(false, autocomplete)(event);
    desktop({ ...event, shiftKey: true });
    desktop({ ...event, nativeEvent: { isComposing: true } });
    desktop({ ...event, defaultPrevented: true });
    expect(sends).toBe(before + 1);
    expect(prevented).toBe(false);
  }
});
