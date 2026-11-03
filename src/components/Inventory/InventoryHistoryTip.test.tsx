import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = { type: string; props: Record<string, unknown> };
const seenKey = "jbcl:inventory-history-tip-seen";

function setup(seen = false, isSmallScreen = false) {
  const storage = new Map<string, string>(seen ? [[seenKey, "true"]] : []);
  let open = false;
  let previousDatePickerOpen: boolean | undefined;
  let pendingEffect: (() => void) | undefined;
  let datePickerOpens = 0;
  const anchorRef = { current: null };
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  const exports = {} as { default: (props: unknown) => Element };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./InventoryHistoryTip.tsx", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: () => [
              open,
              (value: boolean) => {
                open = value;
              },
            ],
            useId: () => "tip-label",
            useEffect: (effect: () => void, [datePickerOpen]: [boolean]) => {
              if (previousDatePickerOpen !== datePickerOpen)
                pendingEffect = effect;
              previousDatePickerOpen = datePickerOpen;
            },
          };
        if (name === "radix-ui")
          return { Popover: { Anchor: "Anchor", Arrow: "Arrow" } };
        if (name === "@/hooks/useMediaQuery")
          return {
            useMediaQuery: (query: string) => {
              expect(query).toBe("(max-width: 639px)");
              return isSmallScreen;
            },
          };
        if (name === "@/utils/storage/safeStorage")
          return {
            safeLocalStorage: {
              getItem: (key: string) => storage.get(key) ?? null,
              setItem: (key: string, value: string) => storage.set(key, value),
            },
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = (datePickerOpen = false, isOwnInventory = false) => {
    const props = {
      datePickerOpen,
      onOpenDatePicker: () => datePickerOpens++,
      anchorRef,
      isOwnInventory,
    };
    const tree = exports.default(props);
    const effect = pendingEffect;
    pendingEffect = undefined;
    effect?.();
    return { initial: tree, tree: exports.default(props) };
  };
  return { render, storage, anchorRef, datePickerOpens: () => datePickerOpens };
}

function content(tree: Element): Element {
  return (tree.props.children as Element[])[1];
}

function buttons(tree: Element): Element[] {
  return (content(tree).props.children as Element[])[2].props
    .children as Element[];
}

test("the tip prefers above the date button on mobile and below on desktop", () => {
  expect(content(setup(false, true).render().tree).props.side).toBe("top");
  expect(content(setup(false, false).render().tree).props.side).toBe("bottom");
});

test("copy addresses the linked inventory owner and keeps the availability note", () => {
  const tip = setup();
  for (const isOwnInventory of [false, true]) {
    const children = content(tip.render(false, isOwnInventory).tree).props
      .children as Element[];
    expect(children[0].props.children).toBe(
      isOwnInventory ? "View your past inventories" : "View past inventories",
    );
    expect(children[1].props.children).toEqual([
      isOwnInventory
        ? "Choose a date to see what you owned."
        : "Choose a date to see what they owned.",
      " ",
      "Only scans from October 31, 2026 onward are available. Dates unlock at midnight UTC. Recent scans may appear under yesterday’s date.",
    ]);
  }
});

test("tip waits for mount, anchors to the date picker, and persists Got it dismissal", () => {
  const tip = setup();
  const { initial, tree } = tip.render();
  expect(initial.props.open).toBe(false);
  expect(tree.props.open).toBe(true);
  expect((tree.props.children as Element[])[0].type).toBe("Anchor");
  expect((tree.props.children as Element[])[0].props.virtualRef).toBe(
    tip.anchorRef,
  );
  (buttons(tree)[1].props.onClick as () => void)();
  expect(tip.render().tree.props.open).toBe(false);
  expect(tip.storage.get(seenKey)).toBe("true");
  expect(setup(true).render().tree.props.open).toBe(false);
});

test("Choose a date dismisses the tip and opens the date picker once", () => {
  const tip = setup();
  (buttons(tip.render().tree)[0].props.onClick as () => void)();
  expect(tip.datePickerOpens()).toBe(1);
  expect(tip.storage.get(seenKey)).toBe("true");
  expect(tip.render().tree.props.open).toBe(false);
});

test("outside or Escape dismissal persists; opening the date picker also consumes the tip", () => {
  const dismissed = setup();
  (dismissed.render().tree.props.onOpenChange as (open: boolean) => void)(
    false,
  );
  expect(dismissed.storage.get(seenKey)).toBe("true");
  expect(dismissed.render().tree.props.open).toBe(false);

  const calendar = setup();
  calendar.render();
  expect(calendar.render(true).tree.props.open).toBe(false);
  expect(calendar.storage.get(seenKey)).toBe("true");
  expect(calendar.render(false).tree.props.open).toBe(false);
});

test("automatic tip opening and closing preserve the current focus", () => {
  const tip = setup();
  const popover = content(tip.render().tree);
  for (const handler of ["onOpenAutoFocus", "onCloseAutoFocus"]) {
    let prevented = false;
    (popover.props[handler] as (event: { preventDefault: () => void }) => void)(
      {
        preventDefault: () => {
          prevented = true;
        },
      },
    );
    expect(prevented).toBe(true);
  }
});
