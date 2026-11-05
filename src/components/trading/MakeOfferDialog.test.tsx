import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import type { TradeItem } from "@/types/trading";

type Node = {
  type: string;
  props: {
    children: unknown[] | string;
    className: string;
    items: TradeItem[];
    onClick: () => void;
    onAdd: (item: TradeItem) => boolean;
    onRemove: (item: TradeItem) => void;
    onQuickAdd: (item: TradeItem) => boolean;
    quickAddUseCatalogApi: boolean;
    showOfferRequestButtons: boolean;
    variant?: "default" | "compact" | "modal";
    favoriteIds: number[];
    onToggleFavorite: (id: number, isFavorited: boolean) => Promise<void>;
    onSelect: (item: TradeItem, side: "offering" | "requesting") => boolean;
  };
};

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

const item: TradeItem = {
  id: 1,
  name: "Torpedo",
  type: "Vehicle",
  cash_value: "30M",
  duped_value: "20M",
  is_limited: 1,
  is_seasonal: 0,
  tradable: 1,
};

function setup(
  options: {
    authenticated?: boolean;
    fetch?: (url: string, options: RequestInit) => Promise<{ ok: boolean }>;
    invalidate?: (options: unknown) => void;
    error?: (message: string) => void;
    login?: (options: unknown) => void;
  } = {},
) {
  const state: unknown[] = [];
  let cursor = 0;
  const noop = () => {};
  const react = {
    useEffect: noop,
    useMemo: (fn: () => unknown) => fn(),
    useState: (initial: unknown) => {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [
        state[index],
        (next: unknown) => {
          state[index] = typeof next === "function" ? next(state[index]) : next;
        },
      ];
    },
  };
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const exports = {} as { MakeOfferDialog: (props: unknown) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./MakeOfferDialog.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      fetch: options.fetch,
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react") return { ...react, default: react };
        if (name.endsWith("/TradeItemPickerV2"))
          return { default: "TradeItemPickerV2" };
        if (name === "@tanstack/react-query")
          return {
            useQuery: () => ({}),
            useQueryClient: () => ({
              invalidateQueries: options.invalidate ?? noop,
            }),
          };
        if (name.endsWith("/useUserFavorites"))
          return {
            useUserFavorites: () => ({ data: [{ item: { id: 1 } }] }),
          };
        if (name.endsWith("/apiDevToken"))
          return {
            buildApiFetchRequest: (_base: string, path: string) => ({
              url: path,
              headers: {},
            }),
          };
        if (name.endsWith("/AuthContext"))
          return {
            useAuthContext: () => ({
              user: options.authenticated ? { id: "user" } : null,
              isAuthenticated: !!options.authenticated,
              setLoginModal: options.login ?? noop,
            }),
          };
        if (name.endsWith("/logger")) return { createLogger: () => ({}) };
        if (name === "sonner")
          return { toast: { error: options.error ?? noop, success: noop } };
        if (name.endsWith("/userInventoryQuery"))
          return { userInventoryQueryOptions: () => ({}) };
        if (name.endsWith("/analytics/web")) return { trackWebEvent: noop };
        if (name.endsWith("/tradeItems"))
          return {
            isCustomTradeItem: (value: TradeItem) => value.type === "Custom",
            tradeItemIdsEqual: (a: unknown, b: unknown) => a === b,
            getTradeItemIdentifier: (value: TradeItem) => String(value.id),
          };
        return new Proxy({}, { get: (_, key) => key });
      },
    },
  );
  const render = () => {
    cursor = 0;
    return nodes(
      exports.MakeOfferDialog({
        isOpen: true,
        onClose: noop,
        trade: { id: 55790, user: { id: "1" } },
        items: [item],
      }),
    );
  };
  render()
    .find((node) => node.props.children === "Customize Offer")!
    .props.onClick();
  return render;
}

test("custom offer add and quantity controls target each side and preserve the eight-item limit", () => {
  const render = setup();
  const grids = () => render().filter((node) => node.type === "ItemGrid");
  grids()[0].props.onQuickAdd(item);
  grids()[0].props.onAdd(item);
  grids()[1].props.onQuickAdd({ ...item, id: 2 });
  expect(grids()[0].props.items).toHaveLength(2);
  expect(grids()[1].props.items.map((value: TradeItem) => value.id)).toEqual([
    2,
  ]);
  for (let i = 0; i < 6; i++) grids()[0].props.onAdd(item);
  expect(grids()[0].props.onAdd(item)).toBe(false);
  expect(grids()[0].props.items).toHaveLength(8);
  grids()[0].props.onRemove(item);
  expect(grids()[0].props.items).toHaveLength(7);
  expect(grids()[0].props.quickAddUseCatalogApi).toBe(true);
});

test("custom offer footer stays outside the scrolling body and Back returns to offer choices", () => {
  const render = setup();
  const view = render();
  const content = view.find((node) => node.type === "DialogContent")!;
  const footer = view.find((node) => node.type === "DialogFooter")!;
  expect(content.props.className).toContain("overflow-hidden");
  expect(content.props.children).toContain(footer);
  expect(
    nodes(footer).some((node) => node.props.children === "Send Offer"),
  ).toBe(true);
  nodes(footer)
    .find((node) => node.props.children === "Back")!
    .props.onClick();
  expect(
    render().some((node) => node.props.children === "Customize Offer"),
  ).toBe(true);
});

test("offer picker uses per-card Offer and Request buttons wired to both sides", () => {
  const render = setup();
  const picker = render().find((node) => node.type === "TradeItemPickerV2")!;
  expect(picker.props.showOfferRequestButtons).toBe(true);
  expect(picker.props.variant).toBe("modal");
  picker.props.onSelect(item, "offering");
  picker.props.onSelect({ ...item, id: 2 }, "requesting");
  const grids = render().filter((node) => node.type === "ItemGrid");
  expect(grids[0].props.items.map((value) => value.id)).toEqual([1]);
  expect(grids[1].props.items.map((value) => value.id)).toEqual([2]);
});

test("favorites require login without making a request", async () => {
  const logins: unknown[] = [];
  const render = setup({
    login: (options) => {
      logins.push(options);
    },
  });
  const picker = render().find((node) => node.type === "TradeItemPickerV2")!;
  expect(picker.props.favoriteIds).toEqual([1]);
  await picker.props.onToggleFavorite(2, false);
  expect(logins).toEqual([{ open: true }]);
});

test("favorites persist additions and removals and refresh the shared favorites cache", async () => {
  const requests: { url: string; options: RequestInit }[] = [];
  const invalidations: unknown[] = [];
  const render = setup({
    authenticated: true,
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: true };
    },
    invalidate: (options) => {
      invalidations.push(options);
    },
  });
  const picker = render().find((node) => node.type === "TradeItemPickerV2")!;
  await picker.props.onToggleFavorite(2, false);
  await picker.props.onToggleFavorite(1, true);
  expect(
    requests.map(({ url, options }) => [
      url,
      options.method,
      options.credentials,
    ]),
  ).toEqual([
    ["/v2/users/me/favorites/2", "PUT", "include"],
    ["/v2/users/me/favorites/1", "DELETE", "include"],
  ]);
  expect(invalidations).toEqual([
    { queryKey: ["user-favorites", "user"] },
    { queryKey: ["user-favorites", "user"] },
  ]);
});

test("failed favorites show an error without changing the shared cache", async () => {
  for (const networkError of [false, true]) {
    const errors: string[] = [];
    const invalidations: unknown[] = [];
    const render = setup({
      authenticated: true,
      fetch: async () => {
        if (networkError) throw new Error("offline");
        return { ok: false };
      },
      error: (message) => {
        errors.push(message);
      },
      invalidate: (options) => {
        invalidations.push(options);
      },
    });
    await render()
      .find((node) => node.type === "TradeItemPickerV2")!
      .props.onToggleFavorite(2, false);
    expect(errors).toEqual(["Failed to update favorite status"]);
    expect(invalidations).toHaveLength(0);
  }
});
