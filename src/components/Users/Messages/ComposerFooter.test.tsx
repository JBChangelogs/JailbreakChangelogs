import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { ComponentProps } from "react";
import type { ComposerFooter } from "./ComposerFooter";

test("replying focuses the composer at the draft end after closing actions without changing the draft", () => {
  let effect: () => (() => void) | undefined;
  let frame: (() => void) | undefined;
  let focused = 0;
  let selection: number[] = [];
  const textarea = {
    value: "existing draft 🙂",
    disabled: false,
    focus: () => focused++,
    setSelectionRange: (...args: number[]) => {
      selection = args;
    },
  };
  const composerRef = { current: { querySelector: () => textarea } };
  const exports = {} as { ComposerFooter: typeof ComposerFooter };
  const jsx = (type: unknown, props: unknown) => ({ type, props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ComposerFooter.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      requestAnimationFrame: (callback: () => void) => {
        frame = callback;
        return 1;
      },
      cancelAnimationFrame: () => {
        frame = undefined;
      },
      require: (name: string) => {
        if (name === "react")
          return {
            useRef: () => composerRef,
            useEffect: (callback: typeof effect) => {
              effect = callback;
            },
          };
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/utils/messages/formatting")
          return { getDisplayName: () => "Recipient" };
        if (name === "@/lib/utils") return { cn: () => "" };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const props = {
    selectedUser: { id: "them" },
    selectedUserId: "them",
    replyingToMessage: null,
  } as ComponentProps<typeof ComposerFooter>;
  exports.ComposerFooter(props);
  expect(effect!()).toBeUndefined();
  expect(frame).toBeUndefined();
  props.replyingToMessage = {
    id: "reply",
    senderId: "them",
    receiverId: "me",
    content: "hello",
  };
  exports.ComposerFooter(props);
  const cleanup = effect!();
  expect(focused).toBe(0);
  frame!();
  expect(focused).toBe(1);
  expect(selection).toEqual([textarea.value.length, textarea.value.length]);
  expect(textarea.value).toBe("existing draft 🙂");
  textarea.disabled = true;
  frame!();
  expect(focused).toBe(1);
  cleanup!();
  expect(frame).toBeUndefined();
});
