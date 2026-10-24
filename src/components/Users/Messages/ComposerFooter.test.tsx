import { expect, test } from "bun:test";
import * as mentions from "@/utils/messages/mentions";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { ComponentProps } from "react";
import type { ComposerBar } from "./ComposerFooter";

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
  const exports = {} as { ComposerBar: typeof ComposerBar };
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
        if (name === "@/utils/messages/mentions") return mentions;
        if (name === "@/hooks/useFrequentEmojis")
          return { useFrequentEmojis: () => [] };
        if (name === "@/utils/messages/formatting")
          return {
            getDisplayName: () => "Recipient",
            formatMessageText: (text: string) => text,
          };
        if (name === "@/lib/utils") return { cn: () => "" };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const props = {
    replying: null,
    typingUsers: [],
  } as unknown as ComponentProps<typeof ComposerBar>;
  exports.ComposerBar(props);
  expect(effect!()).toBeUndefined();
  expect(frame).toBeUndefined();
  props.replying = {
    message: {
      id: "reply",
      senderId: "them",
      receiverId: "me",
      content: "hello",
    },
    sender: null,
  };
  exports.ComposerBar(props);
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
