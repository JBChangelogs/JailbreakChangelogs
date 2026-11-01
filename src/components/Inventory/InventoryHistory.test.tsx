import { expect, test } from "bun:test";
import { format } from "date-fns";
import { renderToStaticMarkup } from "react-dom/server";
import InventoryDataScopeNotice from "./InventoryDataScopeNotice";
import { matchesTextSearch } from "@/utils/helpers/itemSearch";
import InventoryItemsSkeleton from "./InventoryItemsSkeleton";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";

interface Node {
  type: string | ((props: Record<string, unknown>) => Node);
  props: {
    children?: unknown;
    onClick?: () => void;
    onSelect?: (date: Date) => void;
    defaultMonth?: Date;
    className?: string;
    disabled?: boolean | ((date: Date) => boolean);
    href?: string;
    title?: string;
    categoryTitle?: string;
    availableCategories?: string[];
    setSearchTerm?: (term: string) => void;
    setSelectedCategories?: (categories: string[]) => void;
    setSortOrder?: (order: string) => void;
    onChange?: (event: unknown, value: number) => void;
    count?: number;
    page?: number;
    transfers?: typeof item.history;
    historyDate?: string;
    onClose?: () => void;
    data?: { cash_value?: string | null };
  };
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function content(value: unknown): string {
  if (Array.isArray(value)) return value.map(content).join("");
  if (value && typeof value === "object" && "props" in value)
    return content((value as Node).props.children);
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function setup() {
  let active: ReturnType<typeof runner>;
  const selectedDates: string[] = [];
  const batchUserIds: string[][] = [];
  const requests: Array<{
    url: URL;
    init: RequestInit;
    resolve: (response: Response) => void;
  }> = [];
  const jsx = (type: Node["type"], props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: Record<string, unknown>) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./InventoryHistory.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      AbortController,
      AbortSignal,
      URLSearchParams,
      fetch: (url: string, init: RequestInit) =>
        new Promise<Response>((resolve) =>
          requests.push({ url: new URL(url), init, resolve }),
        ),
      require: (id: string) => {
        if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (id === "react")
          return {
            useState: (initial: unknown) => {
              const instance = active;
              const index = instance.cursor++;
              if (!(index in instance.state)) instance.state[index] = initial;
              return [
                instance.state[index],
                (next: unknown) => {
                  instance.state[index] =
                    typeof next === "function"
                      ? next(instance.state[index])
                      : next;
                },
              ];
            },
            useEffect: (
              effect: () => (() => void) | undefined,
              deps: unknown[],
            ) => {
              const index = active.cursor++;
              const previous = active.effects[index];
              if (
                !previous ||
                deps.some((dep, i) => dep !== previous.deps[i])
              ) {
                previous?.cleanup?.();
                active.effects[index] = { deps, cleanup: effect() };
              }
            },
          };
        if (id === "next/link") return { default: "a" };
        if (id.endsWith("/button")) return { Button: "button" };
        if (id === "date-fns") return { format };
        if (id.endsWith("/calendar")) return { Calendar: "calendar" };
        if (id.endsWith("/IconWrapper")) return { Icon: "icon" };
        if (id.endsWith("/popover"))
          return {
            Popover: "popover",
            PopoverContent: "popover-content",
            PopoverTrigger: "popover-trigger",
          };
        if (id.endsWith("/TradeHistoryModal"))
          return { default: "trade-modal" };
        if (id.endsWith("/useBatchUserData"))
          return {
            useBatchUserData: (ids: string[]) => {
              batchUserIds.push(ids);
              return { robloxUsers: { "111": { displayName: "Owner One" } } };
            },
          };
        if (id === "./InventoryMarketSummary")
          return { default: "market-summary" };
        if (id.endsWith("/usePartialItems"))
          return {
            useCatalogValues: () => ({
              data: [{ id: 341, cash_value: "28m" }],
            }),
          };
        if (id === "./InventoryItemAppearance")
          return { default: "item-appearance" };
        if (id === "./InventoryListControls")
          return { default: "list-controls" };
        if (id.endsWith("/Pagination")) return { Pagination: "pagination" };
        if (id.endsWith("/itemSearch")) return { matchesTextSearch };
        if (id === "./InventoryItemsSkeleton")
          return { default: "inventory-skeleton" };
        if (id.endsWith("/api"))
          return {
            INVENTORY_API_URL: "https://inventory.test",
            INVENTORY_API_SOURCE_HEADER: "test-source",
          };
        if (id.endsWith("/apiDevToken"))
          return {
            buildApiFetchRequest: (base: string, path: string) => ({
              url: base + path,
              headers: { Authorization: "dev-token" },
            }),
          };
        throw new Error(`Unexpected import ${id}`);
      },
    },
  );
  function runner(
    component = exports.default,
    props: Record<string, unknown> = {
      userId: "123",
      children: "Latest inventory",
      preview: "Inventory preview",
      onDateChange: (date: string) => selectedDates.push(date),
    },
  ) {
    const instance = {
      state: [] as unknown[],
      cursor: 0,
      effects: [] as Array<{ deps: unknown[]; cleanup?: () => void }>,
      render() {
        active = instance;
        instance.cursor = 0;
        return component(props);
      },
    };
    return instance;
  }
  const respond = async (index: number, data: unknown, status = 200) => {
    requests[index].resolve(Response.json(data, { status }));
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  const select = (view: Node, date: string) =>
    nodes(view).find((node) => node.type === "calendar")!.props.onSelect!(
      new Date(`${date}T00:00:00`),
    );

  return { runner, requests, respond, select, selectedDates, batchUserIds };
}

const item = {
  item_id: "aW13RLHQ^hRP",
  branch_id: "0",
  catalog_item_id: 341,
  title: "HyperPurple Level 5",
  category_title: "HyperChrome",
  held_since: 1791500000,
  history: [
    {
      from_user_id: "5296890780",
      to_user_id: "5297166893",
      trade_time: 1704067200,
      gap: true,
    },
  ],
};

test("date selection uses UTC snapshots, ignores stale requests, and restores latest inventory", async () => {
  const { runner, requests, respond, select } = setup();
  const page = runner();
  let view = page.render();
  expect(content(view)).toContain("Latest inventory");
  expect(content(view).indexOf("Inventory preview")).toBeLessThan(
    content(view).indexOf("Inventory Items"),
  );
  expect(requests).toHaveLength(0);
  select(view, "2026-10-14");
  view = page.render();
  expect(nodes(view).some((node) => node.type === "inventory-skeleton")).toBe(
    true,
  );
  expect(content(view)).not.toContain("Inventory preview");
  expect(content(view)).not.toContain("Latest inventory");
  const calendarMonth = nodes(view).find((node) => node.type === "calendar")!
    .props.defaultMonth!;
  expect(calendarMonth.getFullYear()).toBe(2026);
  expect(calendarMonth.getMonth()).toBe(9);
  expect(requests[0].url.pathname).toBe("/user/inventory/history");
  expect(requests[0].url.searchParams.get("id")).toBe("123");
  expect(requests[0].url.searchParams.get("date")).toBe("2026-10-14");
  expect(requests[0].init.headers).toEqual({
    Authorization: "dev-token",
    "X-Source": "test-source",
  });
  select(view, "2026-10-15");
  page.render();
  expect(requests[0].init.signal?.aborted).toBe(true);
  await respond(1, { as_of: 1792000000, items: [item] });
  await respond(0, { as_of: 0, items: [] });
  view = page.render();
  expect(content(view)).toContain("Inventory as of 2026-10-14 17:46:40 UTC");
  expect(
    nodes(view).find((node) => node.type === "market-summary")!.props.data
      ?.cash_value,
  ).toBe("28m");
  expect(
    nodes(view).find((node) => node.type === "item-appearance")!.props.title,
  ).toBe(item.title);
  expect(nodes(view).some((node) => node.type === "trade-modal")).toBe(false);
  expect(content(view)).not.toContain("Trade history through");
  nodes(view).find(
    (node) => node.type === "button" && content(node) === "History",
  )!.props.onClick!();
  view = page.render();
  const modal = nodes(view).find((node) => node.type === "trade-modal")!;
  expect(modal.props.transfers).toEqual(item.history);
  expect(modal.props.historyDate).toBe("2026-10-15");
  modal.props.onClose!();
  view = page.render();
  nodes(view).find(
    (node) =>
      node.type === "button" && content(node).includes("Back to latest"),
  )!.props.onClick!();
  view = page.render();
  expect(content(view)).toContain("Latest inventory");
  expect(
    nodes(view).find((node) => node.type === "calendar")!.props.defaultMonth,
  ).toBeUndefined();
});

test("bad dates and missing history are actionable, and empty inventories are valid", async () => {
  const { runner, respond, select } = setup();
  const page = runner();
  select(page.render(), "2020-01-01");
  page.render();
  await respond(0, "bad date", 400);
  let view = page.render();
  expect(content(view)).toContain("Invalid date");
  nodes(view).find(
    (node) => node.type === "button" && content(node) === "Try again",
  )!.props.onClick!();
  page.render();
  await respond(1, "not found", 404);
  view = page.render();
  expect(content(view)).toContain(
    "No recorded inventory available as of 2020-01-01",
  );
  expect(content(view)).not.toContain("Try again");
  expect(nodes(view).some((node) => node.type === "inventory-skeleton")).toBe(
    false,
  );
  select(view, "2026-10-15");
  page.render();
  await respond(2, { as_of: 1792000000, items: [] });
  expect(content(page.render())).toContain("No items in this inventory");
});

test("owner lookup uses the exact copy and lists duplicated owners with all three holding states", async () => {
  const { runner, requests, respond, select, batchUserIds } = setup();
  const page = runner();
  select(page.render(), "2026-10-15");
  page.render();
  await respond(0, { as_of: 1792000000, items: [item] });
  const cardView = page.render();
  nodes(cardView).find(
    (node) => node.type === "button" && content(node) === "History",
  )!.props.onClick!();
  const ownerNode = nodes(page.render()).find(
    (node) => typeof node.type === "function",
  )!;
  const owner = runner(
    ownerNode.type as (props: Record<string, unknown>) => Node,
    ownerNode.props,
  );
  let view = owner.render();
  expect(requests).toHaveLength(2);
  expect(content(view)).toContain("Finding current owner");
  expect(content(view)).not.toContain("View current owner");
  expect(requests[1].url.pathname).toBe("/item/owner");
  expect(requests[1].url.searchParams.get("id")).toBe(item.item_id);
  expect(requests[1].url.searchParams.get("branch_id")).toBe("0");
  await respond(1, {
    duplicated_since: true,
    owners: [
      {
        user_id: "111",
        last_seen: 1793418290,
        still_held: true,
        left_at: null,
      },
      { user_id: "222", last_seen: 0, still_held: false, left_at: 1793418290 },
      { user_id: "333", last_seen: null, still_held: null, left_at: null },
    ],
  });
  view = owner.render();
  expect(
    nodes(view)
      .filter((node) => node.type === "a")
      .map((node) => node.props.href),
  ).toEqual(["/inventories/111", "/inventories/222", "/inventories/333"]);
  expect(content(view)).toContain("Duplicated since this scan");
  expect(content(view)).toContain("Still held at their latest scan");
  expect(content(view)).toContain("traded away since 2026-10-31 03:44:50 UTC");
  expect(content(view)).toContain("Current ownership unknown");
  expect(content(view)).toContain("Owner One");
  expect(batchUserIds.at(-1)).toEqual(["111", "222", "333"]);
});

test("missing owner can be retried and a single owner links to their inventory", async () => {
  const { runner, respond, select } = setup();
  const page = runner();
  select(page.render(), "2026-10-15");
  page.render();
  await respond(0, { as_of: 1792000000, items: [item] });
  const cardView = page.render();
  nodes(cardView).find(
    (node) => node.type === "button" && content(node) === "History",
  )!.props.onClick!();
  const ownerNode = nodes(page.render()).find(
    (node) => typeof node.type === "function",
  )!;
  const owner = runner(
    ownerNode.type as (props: Record<string, unknown>) => Node,
    ownerNode.props,
  );
  owner.render();
  await respond(1, "not found", 404);
  let view = owner.render();
  expect(content(view)).toContain("This copy could not be found");
  nodes(view).find((node) => node.type === "button")!.props.onClick!();
  owner.render();
  await respond(2, {
    duplicated_since: false,
    owners: [
      {
        user_id: "1384561011",
        last_seen: null,
        still_held: null,
        left_at: null,
      },
    ],
  });
  view = owner.render();
  expect(nodes(view).find((node) => node.type === "a")!.props.href).toBe(
    "/inventories/1384561011",
  );
  expect(content(view)).not.toContain("This copy could not be found");
});

test("shared inventory loading state contains eight animated item cards", () => {
  expect(
    nodes(InventoryItemsSkeleton()).filter((node) =>
      node.props.className?.includes("animate-pulse"),
    ),
  ).toHaveLength(8);
});

test("calendar allows today in UTC and disables future dates", () => {
  const { runner } = setup();
  const view = runner().render();
  const disabled = nodes(view).find((node) => node.type === "calendar")!.props
    .disabled as (date: Date) => boolean;
  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  expect(disabled(yesterday)).toBe(false);
  expect(disabled(today)).toBe(false);
  expect(disabled(tomorrow)).toBe(true);
});

test("historical lists paginate, search, filter and sort the dated items", async () => {
  const { runner, respond, select, selectedDates } = setup();
  const page = runner();
  select(page.render(), "2026-10-31");
  page.render();
  const items = Array.from({ length: 19 }, (_, index) => ({
    ...item,
    item_id: `copy-${index}`,
    title: `Item ${String(index).padStart(2, "0")}`,
    category_title: index % 2 ? "Rim" : "Vehicle",
    held_since: item.held_since + index,
  }));
  await respond(0, { as_of: 1792000000, items });
  let view = page.render();
  const cards = () =>
    nodes(view).filter((node) => node.type === "item-appearance");
  expect(cards()).toHaveLength(16);
  expect(cards()[0].props.title).toBe("Item 18");
  const pagination = nodes(view).find((node) => node.type === "pagination")!;
  expect(pagination.props.count).toBe(2);
  pagination.props.onChange!(null, 2);
  view = page.render();
  expect(cards()).toHaveLength(3);
  let controls = nodes(view).find((node) => node.type === "list-controls")!;
  expect(controls.props.availableCategories).toEqual(["Rim", "Vehicle"]);
  controls.props.setSelectedCategories!(["Rim"]);
  controls.props.setSortOrder!("alpha-asc");
  view = page.render();
  expect(cards()).toHaveLength(9);
  expect(cards()[0].props.title).toBe("Item 01");
  expect(nodes(view).some((node) => node.type === "pagination")).toBe(false);
  controls = nodes(view).find((node) => node.type === "list-controls")!;
  controls.props.setSearchTerm!("item 03");
  view = page.render();
  expect(cards()).toHaveLength(1);
  expect(cards()[0].props.title).toBe("Item 03");
  expect(selectedDates).toEqual(["2026-10-31"]);
  nodes(view).find(
    (node) =>
      node.type === "button" && content(node).includes("Back to latest"),
  )!.props.onClick!();
  page.render();
  expect(selectedDates).toEqual(["2026-10-31", ""]);
});

test("both data scope notices use the same visible banner", () => {
  const historical = renderToStaticMarkup(
    <InventoryDataScopeNotice historical />,
  );
  const latest = renderToStaticMarkup(
    <InventoryDataScopeNotice historical={false} />,
  );
  for (const html of [historical, latest]) {
    expect(html).toContain('role="note"');
    expect(html).toContain("bg-button-info/10");
    expect(html).toContain("border-button-info/30");
  }
  expect(historical).toContain("Historical inventory items");
  expect(historical).toContain(
    "Profile, stats, other tabs, market values and current owner lookups",
  );
  expect(latest).toContain("Latest available data");
});
