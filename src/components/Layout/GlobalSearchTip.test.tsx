import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

type Element = { type: string; props: Record<string, unknown> };
const seenKey = "jbcl:global-search-tip-seen";

function setup(seen = false) {
  const storage = new Map<string, string>(seen ? [[seenKey, "true"]] : []);
  let open = false;
  let previousSearchOpen: boolean | undefined;
  let pendingEffect: (() => void) | undefined;
  let searchOpens = 0;
  const jsx = (type: string, props: Element["props"]) => ({ type, props });
  const exports = {} as { default: (props: unknown) => Element };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./GlobalSearchTip.tsx", import.meta.url), "utf8"),
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
            useEffect: (effect: () => void, [searchOpen]: [boolean]) => {
              if (previousSearchOpen !== searchOpen) pendingEffect = effect;
              previousSearchOpen = searchOpen;
            },
          };
        if (name === "radix-ui")
          return { Popover: { Anchor: "Anchor", Arrow: "Arrow" } };
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
  const render = (searchOpen = false) => {
    const props = {
      searchOpen,
      onOpenSearch: () => searchOpens++,
      children: jsx("button", {}),
    };
    const tree = exports.default(props);
    const effect = pendingEffect;
    pendingEffect = undefined;
    effect?.();
    return { initial: tree, tree: exports.default(props) };
  };
  return { render, storage, searchOpens: () => searchOpens };
}

function content(tree: Element): Element {
  return (tree.props.children as Element[])[1];
}

function buttons(tree: Element): Element[] {
  return (content(tree).props.children as Element[])[2].props
    .children as Element[];
}

test("tip waits for mount, anchors to search, and persists Got it dismissal", () => {
  const tip = setup();
  const { initial, tree } = tip.render();
  expect(initial.props.open).toBe(false);
  expect(tree.props.open).toBe(true);
  expect((tree.props.children as Element[])[0].type).toBe("Anchor");
  (buttons(tree)[1].props.onClick as () => void)();
  expect(tip.render().tree.props.open).toBe(false);
  expect(tip.storage.get(seenKey)).toBe("true");
  expect(setup(true).render().tree.props.open).toBe(false);
});

test("Try search dismisses the tip and opens search once", () => {
  const tip = setup();
  (buttons(tip.render().tree)[0].props.onClick as () => void)();
  expect(tip.searchOpens()).toBe(1);
  expect(tip.storage.get(seenKey)).toBe("true");
  expect(tip.render().tree.props.open).toBe(false);
});

test("outside or Escape dismissal persists; keyboard search also consumes the tip", () => {
  const dismissed = setup();
  (dismissed.render().tree.props.onOpenChange as (open: boolean) => void)(
    false,
  );
  expect(dismissed.storage.get(seenKey)).toBe("true");
  expect(dismissed.render().tree.props.open).toBe(false);

  const keyboard = setup();
  keyboard.render();
  expect(keyboard.render(true).tree.props.open).toBe(false);
  expect(keyboard.storage.get(seenKey)).toBe("true");
  expect(keyboard.render(false).tree.props.open).toBe(false);
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
