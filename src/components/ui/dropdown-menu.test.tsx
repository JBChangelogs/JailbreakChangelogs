import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type * as React from "react";
import type * as Dropdown from "./dropdown-menu";
import { cn } from "@/lib/utils";

type TriggerHandlers = {
  onPointerDown: (input: ReturnType<typeof event>) => void;
  onClick: (input: ReturnType<typeof event>) => void;
  onKeyDown: (input: unknown) => void;
};

function harness() {
  let state: boolean | undefined;
  let menu: unknown;
  const refs: { current: unknown }[] = [];
  let refIndex = 0;
  const exports = {} as {
    DropdownMenu: (
      props: React.ComponentProps<typeof Dropdown.DropdownMenu>,
    ) => {
      props: { value: unknown; children: { props: { open: boolean } } };
    };
    DropdownMenuTrigger: (
      props: React.ComponentProps<typeof Dropdown.DropdownMenuTrigger>,
    ) => { props: TriggerHandlers };
  };
  const jsx = (_type: unknown, props: unknown) => ({ props });
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./dropdown-menu.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      document: { activeElement: null },
      HTMLElement: class {},
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "@/lib/utils") return { cn };
        if (name === "react")
          return {
            createContext: () => ({ Provider: "Provider" }),
            useContext: () => menu,
            useRef: (initial: unknown) =>
              (refs[refIndex++] ??= { current: initial }),
            forwardRef: (render: unknown) => render,
            useState: (initial: boolean) => {
              state ??= initial;
              return [
                state,
                (value: boolean) => {
                  state = value;
                },
              ];
            },
          };
        if (name === "radix-ui")
          return { DropdownMenu: new Proxy({}, { get: () => ({}) }) };
        return {};
      },
    },
  );
  const root = (
    props: React.ComponentProps<typeof Dropdown.DropdownMenu> = {},
  ) => {
    const provider = exports.DropdownMenu(props);
    menu = provider.props.value;
    return provider.props.children.props;
  };
  const trigger = (
    props: React.ComponentProps<typeof Dropdown.DropdownMenuTrigger> = {},
  ) => {
    refIndex = 0;
    return exports.DropdownMenuTrigger(props).props;
  };
  const tap = (
    props: React.ComponentProps<typeof Dropdown.DropdownMenuTrigger> = {},
  ) => {
    const handlers = trigger(props);
    handlers.onPointerDown(event("touch"));
    handlers.onClick(event("touch"));
  };
  return { root, trigger, tap };
}

function event(pointerType: string) {
  return {
    pointerType,
    detail: pointerType ? 1 : 0,
    defaultPrevented: false,
    preventDefault() {
      this.defaultPrevented = true;
    },
  };
}

test("touch scroll starts do not open dropdowns; completed taps toggle them", () => {
  const h = harness();
  h.root();
  const touch = event("touch");
  h.trigger().onPointerDown(touch);
  expect(touch.defaultPrevented).toBe(true); // Suppresses Radix's pointerdown toggle.
  expect(h.root().open).toBe(false); // A scroll has no subsequent native click.
  h.tap();
  expect(h.root().open).toBe(true);
  h.tap();
  expect(h.root().open).toBe(false);
});

test("mouse, pen and keyboard keep Radix activation without a second toggle", () => {
  const h = harness();
  h.root();
  for (const type of ["mouse", "pen", ""]) {
    const input = event(type);
    h.trigger().onPointerDown(input);
    expect(input.defaultPrevented).toBe(false);
    h.trigger().onClick(input);
    expect(h.root().open).toBe(false);
  }
});

test("Samsung taps with click detail 0 still toggle; keyboard clicks after a touch do not", () => {
  const h = harness();
  h.root();
  h.trigger().onPointerDown(event("touch"));
  h.trigger().onClick({ ...event("touch"), detail: 0 });
  expect(h.root().open).toBe(true);

  const k = harness();
  k.root();
  k.trigger().onPointerDown(event("touch")); // Cancelled by a scroll.
  k.trigger().onKeyDown({ key: "Enter" });
  k.trigger().onClick(event(""));
  expect(k.root().open).toBe(false);
});

test("touch clicks respect disabled controls and caller click cancellation", () => {
  const h = harness();
  h.root();
  h.tap({ disabled: true });
  expect(h.root().open).toBe(false);
  let clicks = 0;
  h.tap({
    onClick: (e) => {
      clicks++;
      e.preventDefault();
    },
  });
  expect(clicks).toBe(1);
  expect(h.root().open).toBe(false);
});

test("touch toggles honor controlled state, defaultOpen and onOpenChange", () => {
  const h = harness();
  const changes: boolean[] = [];
  const props = {
    open: false,
    onOpenChange: (open: boolean) => changes.push(open),
  };
  h.root(props);
  h.tap();
  expect(changes).toEqual([true]);
  expect(h.root(props).open).toBe(false);
  h.root({ ...props, open: true });
  h.tap();
  expect(changes).toEqual([true, false]);

  const uncontrolled = harness();
  expect(uncontrolled.root({ defaultOpen: true }).open).toBe(true);
  uncontrolled.tap();
  expect(uncontrolled.root().open).toBe(false);
});

test("tapping the trigger of an open menu closes it", () => {
  const h = harness();
  const root = h.root({ defaultOpen: true });
  h.trigger().onPointerDown(event("touch"));
  (root as unknown as { onOpenChange: (open: boolean) => void }).onOpenChange(
    false,
  );
  h.root(); // Re-render, so the click handler sees the closed state.
  h.trigger().onClick(event("touch"));
  expect(h.root().open).toBe(false);
});
