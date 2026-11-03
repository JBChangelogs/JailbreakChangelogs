import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import { ThemeApiError, type MarketplaceTheme } from "@/utils/api/userThemes";
import { isItemSearchShortcut } from "@/utils/ui/searchShortcut";

interface Node {
  type: string;
  props: Record<string, unknown>;
}

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

function marketplace({
  signedIn = true,
  author = "other",
  reportError = false,
  unpublishError = false,
  empty = false,
  pending = false,
  fetching = false,
  total = 25,
} = {}) {
  const theme: MarketplaceTheme = {
    share_code: "ABCDEFGH",
    label: "Midnight",
    scheme: "dark",
    vars: {},
    logo_filter: null,
    user: { id: author, username: "author" },
  };
  const states: unknown[] = [];
  let cursor = 0;
  let queryKey: unknown[] = [];
  const applied: MarketplaceTheme[] = [];
  const recent: string[] = [];
  const reports: unknown[] = [];
  const errors: unknown[] = [];
  const updates: unknown[] = [];
  const invalidations: unknown[] = [];
  const searchRef = { current: null as { focus: () => void } | null };
  let keydown: ((event: KeyboardEvent) => void) | undefined;
  const effects: { deps: unknown[]; cleanup?: () => void }[] = [];
  let effectCursor = 0;
  let dirty = false;
  let debounced = "";
  let debounceDelay = 0;
  const jsx = (type: string, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: () => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./ThemeMarketplace.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
      },
    ).outputText,
    {
      exports,
      Error,
      window: {
        addEventListener: (
          _name: string,
          callback: (event: KeyboardEvent) => void,
        ) => {
          keydown = callback;
        },
        removeEventListener: (
          _name: string,
          callback: (event: KeyboardEvent) => void,
        ) => {
          if (keydown === callback) keydown = undefined;
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: () => searchRef,
            useEffect: (
              effect: () => (() => void) | undefined,
              deps: unknown[],
            ) => {
              const index = effectCursor++;
              const previous = effects[index];
              if (
                previous &&
                deps.every((value, i) => value === previous.deps[i])
              )
                return;
              previous?.cleanup?.();
              effects[index] = { deps, cleanup: effect() };
            },
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in states)) states[index] = initial;
              return [
                states[index],
                (value: unknown) => {
                  if (states[index] !== value) dirty = true;
                  states[index] = value;
                },
              ];
            },
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => ({
              invalidateQueries: async ({
                queryKey,
              }: {
                queryKey: unknown;
              }) => {
                invalidations.push(queryKey);
              },
            }),
            useQuery: (options: { queryKey: unknown[] }) => {
              queryKey = options.queryKey;
              return {
                data: pending
                  ? undefined
                  : {
                      items: empty ? [] : [theme],
                      total: empty ? 0 : total,
                      page: states[2],
                      total_pages: empty ? 0 : 2,
                    },
                isPending: pending,
                isFetching: pending || fetching,
              };
            },
          };
        if (name === "@/contexts/AuthContext")
          return {
            useAuthContext: () => ({
              user: signedIn ? { id: "me" } : null,
              isAuthenticated: signedIn,
            }),
          };
        if (name === "@/contexts/ThemeContext")
          return { useTheme: () => ({ customTheme: applied.at(-1) }) };
        if (name === "@/utils/api/userThemes")
          return {
            ThemeApiError,
            listMyThemes: async () => ({ themes: [{ ...theme, id: 7 }] }),
            updateMyTheme: async (id: number, input: unknown) => {
              updates.push({ id, input });
              if (unpublishError) throw new Error("API unavailable");
            },
            reportMarketplaceTheme: async (code: string, reason: string) => {
              reports.push({ code, reason });
              if (reportError)
                throw new ThemeApiError(
                  400,
                  "report_exists",
                  "Already reported",
                );
            },
          };
        if (name === "@/utils/ui/customTheme")
          return {
            setCustomTheme: (value: MarketplaceTheme) => applied.push(value),
          };
        if (name === "@/utils/ui/recentThemes")
          return { rememberSharedTheme: (code: string) => recent.push(code) };
        if (name === "@/utils/ui/searchShortcut")
          return { isItemSearchShortcut };
        if (name === "@/utils/ui/avatar") return { UserAvatar: "UserAvatar" };
        if (name === "@/hooks/useDebounce")
          return {
            useDebounce: (_value: string, delay: number) => {
              debounceDelay = delay;
              return debounced;
            },
          };
        if (name === "sonner")
          return {
            toast: {
              success: () => {},
              error: (_title: string, detail: unknown) => errors.push(detail),
            },
          };
        if (name === "next/link") return { default: "Link" };
        if (name.startsWith("@/components/"))
          return new Proxy({}, { get: (_target, key) => String(key) });
        throw new Error(`Unexpected import: ${name}`);
      },
    },
  );
  const render = () => {
    let rendered: Node[];
    do {
      cursor = 0;
      effectCursor = 0;
      dirty = false;
      rendered = nodes(exports.default());
    } while (dirty);
    return rendered;
  };
  const button = (label: string) =>
    render().find(
      (node) => node.type === "Button" && node.props.children === label,
    )!;
  const click = (label: string) =>
    (button(label).props.onClick as () => void)();
  const dialog = () =>
    render().find((node) => node.type === "ReportReasonModal")!.props;
  return {
    render,
    button,
    click,
    dialog,
    applied,
    recent,
    reports,
    errors,
    updates,
    invalidations,
    keydown: (event: Partial<KeyboardEvent>) =>
      keydown?.(event as KeyboardEvent),
    cleanup: () => effects.forEach((effect) => effect.cleanup?.()),
    flushDebounce: () => {
      debounced = String(states[0]).trim();
      return render();
    },
    debounceDelay: () => debounceDelay,
    key: () => queryKey,
  };
}

test("search and sort reset pagination, and use theme applies and remembers the share code", () => {
  const view = marketplace();
  const paginate = () =>
    view.render().find((node) => node.type === "Pagination")!.props;
  (paginate().onChange as (event: unknown, page: number) => void)(null, 2);
  view.render();
  expect(view.key()).toEqual(["theme-marketplace", "", 2, "newest"]);
  const input = view.render().find((node) => node.type === "input")!;
  (input.props.onChange as (event: unknown) => void)({
    target: { value: "  id:ABCDEFGH  " },
  });
  const form = view.render().find((node) => node.type === "form")!;
  (form.props.onSubmit as (event: unknown) => void)({ preventDefault() {} });
  view.render();
  expect(view.key()).toEqual(["theme-marketplace", "id:ABCDEFGH", 1, "newest"]);
  (paginate().onChange as (event: unknown, page: number) => void)(null, 2);
  const sort = view
    .render()
    .find((node) => node.type === "DropdownMenuRadioGroup")!;
  (sort.props.onValueChange as (value: string) => void)("oldest");
  view.render();
  expect(view.key()).toEqual(["theme-marketplace", "id:ABCDEFGH", 1, "oldest"]);
  view.click("Use theme");
  expect(view.applied[0].share_code).toBe("ABCDEFGH");
  expect(view.recent).toEqual(["ABCDEFGH"]);
  expect(view.button("In use").props.disabled).toBe(true);
});

test("typing searches after the debounce, resets pagination, and shows a waiting spinner", () => {
  const view = marketplace();
  const pagination = view.render().find((node) => node.type === "Pagination")!;
  (pagination.props.onChange as (event: unknown, page: number) => void)(
    null,
    2,
  );
  const input = view.render().find((node) => node.type === "input")!;
  (input.props.onChange as (event: unknown) => void)({
    target: { value: "  Moon  " },
  });
  const waiting = view.render();
  expect(view.key()).toEqual(["theme-marketplace", "", 2, "newest"]);
  expect(waiting.some((node) => node.type === "Spinner")).toBe(true);
  expect(view.debounceDelay()).toBe(400);
  const searched = view.flushDebounce();
  expect(view.key()).toEqual(["theme-marketplace", "Moon", 1, "newest"]);
  expect(searched.some((node) => node.type === "Spinner")).toBe(false);
});

test("fetching themes replaces the search icon with a spinner", () => {
  const rendered = marketplace({ fetching: true }).render();
  const button = rendered.find(
    (node) => node.type === "button" && node.props["aria-label"] === "Search",
  )!;
  expect(button.props["aria-busy"]).toBe(true);
  expect(
    nodes(button.props.children).some((node) => node.type === "Spinner"),
  ).toBe(true);
});

test("report is hidden for visitors and owners; another user's theme can be reported", async () => {
  for (const options of [{ signedIn: false }, { author: "me" }]) {
    expect(marketplace(options).button("Report")).toBeUndefined();
  }
  const view = marketplace();
  view.click("Report");
  expect(view.dialog().open).toBe(true);
  await (view.dialog().onSubmit as (reason: string) => Promise<void>)(
    "Offensive name",
  );
  expect(view.reports).toEqual([
    { code: "ABCDEFGH", reason: "Offensive name" },
  ]);
  expect(view.dialog().open).toBe(false);
});

test("owners can unpublish a marketplace card without deleting or stopping their theme", async () => {
  const view = marketplace({ author: "me" });
  view.click("Use theme");
  view.click("Remove from marketplace");
  expect(view.button("Removing…").props.disabled).toBe(true);
  await new Promise((resolve) => setImmediate(resolve));
  expect(view.updates).toEqual([{ id: 7, input: { published: false } }]);
  expect(view.invalidations).toEqual([
    ["my-themes", "me"],
    ["theme-marketplace"],
  ]);
  expect(view.applied[0].share_code).toBe("ABCDEFGH");
  expect(view.button("Remove from marketplace").props.disabled).toBe(false);
});

test("marketplace removal is hidden from visitors and non-owners", () => {
  for (const options of [
    { signedIn: false, author: "me" },
    { author: "other" },
  ]) {
    expect(
      marketplace(options).button("Remove from marketplace"),
    ).toBeUndefined();
  }
});

test("failed marketplace removal leaves the card available and shows the API error", async () => {
  const view = marketplace({ author: "me", unpublishError: true });
  view.click("Remove from marketplace");
  await new Promise((resolve) => setImmediate(resolve));
  expect(view.invalidations).toEqual([]);
  expect(view.button("Remove from marketplace").props.disabled).toBe(false);
  expect(view.errors).toEqual([{ description: "API unavailable" }]);
});

test("search and clear actions live inside the field, and clearing resets results and focus", () => {
  const view = marketplace();
  const input = view.render().find((node) => node.type === "input")!;
  let focused = false;
  (input.props.ref as { current: unknown }).current = {
    focus: () => {
      focused = true;
    },
  };
  (input.props.onChange as (event: unknown) => void)({
    target: { value: "Moon" },
  });
  const form = view.render().find((node) => node.type === "form")!;
  expect(
    nodes(form.props.children).some(
      (node) => node.type === "button" && node.props["aria-label"] === "Search",
    ),
  ).toBe(true);
  (form.props.onSubmit as (event: unknown) => void)({ preventDefault() {} });
  const clear = view
    .render()
    .find(
      (node) =>
        node.type === "button" && node.props["aria-label"] === "Clear search",
    )!;
  (clear.props.onClick as () => void)();
  expect(view.render().find((node) => node.type === "input")!.props.value).toBe(
    "",
  );
  expect(view.key()).toEqual(["theme-marketplace", "", 1, "newest"]);
  expect(focused).toBe(true);
});

test("report failure keeps the dialog open and explains duplicate reports", async () => {
  const view = marketplace({ reportError: true });
  view.click("Report");
  await (view.dialog().onSubmit as (reason: string) => Promise<void>)(
    "Offensive name",
  );
  expect(view.dialog().open).toBe(true);
  expect(view.errors).toEqual([
    { description: "You've already reported this theme." },
  ]);
});

test("empty marketplace explains publishing and links to theme settings", () => {
  const view = marketplace({ empty: true });
  const rendered = view.render();
  expect(
    rendered.some((node) => node.props.children === "No themes published yet"),
  ).toBe(true);
  expect(
    rendered.find(
      (node) =>
        node.type === "Link" && node.props.children === "Open theme settings",
    )?.props.href,
  ).toBe("/settings?highlight=themes#themes");
  expect(view.button("Clear search")).toBeUndefined();
  expect(rendered.some((node) => node.props.children === "0 themes")).toBe(
    false,
  );
});

test("theme count matches the values page label and text size", () => {
  for (const total of [1, 2]) {
    const view = marketplace({ total });
    const label = view
      .render()
      .find((node) => node.props.children === `Total Themes: ${total}`)!;
    expect(label.type).toBe("p");
    expect(label.props.className).toBe("text-secondary-text");
    (
      view.render().find((node) => node.type === "input")!.props.onChange as (
        event: unknown,
      ) => void
    )({ target: { value: "Moon" } });
    (
      view.render().find((node) => node.type === "form")!.props.onSubmit as (
        event: unknown,
      ) => void
    )({ preventDefault() {} });
    expect(
      view
        .render()
        .some(
          (node) =>
            node.props.children ===
            `Found ${total} ${total === 1 ? "theme" : "themes"} matching "Moon"`,
        ),
    ).toBe(true);
  }
});

test("slash focuses marketplace search, respects editable targets, and unregisters on unmount", () => {
  const view = marketplace();
  const rendered = view.render();
  let focused = 0;
  let prevented = 0;
  const input = rendered.find((node) => node.type === "input")!;
  (input.props.ref as { current: unknown }).current = {
    focus: () => {
      focused++;
    },
  };
  const event = {
    key: "/",
    preventDefault: () => {
      prevented++;
    },
  };
  view.keydown(event);
  expect(focused).toBe(1);
  expect(prevented).toBe(1);
  view.keydown({
    ...event,
    target: { closest: () => ({}) } as unknown as EventTarget,
  });
  view.keydown({ ...event, ctrlKey: true });
  expect(focused).toBe(1);
  expect(prevented).toBe(1);
  expect(
    rendered.some((node) => node.type === "kbd" && node.props.children === "/"),
  ).toBe(true);
  view.cleanup();
  view.keydown(event);
  expect(focused).toBe(1);
});

test("pending themes show six skeleton cards with an accessible loading status", () => {
  const rendered = marketplace({ pending: true }).render();
  const grid = rendered.find(
    (node) => node.type === "div" && node.props["aria-busy"] === true,
  )!;
  expect(
    nodes(grid.props.children).filter(
      (node) => node.type === "div" && node.props["aria-hidden"] === "true",
    ),
  ).toHaveLength(6);
  expect(rendered.filter((node) => node.type === "Skeleton")).toHaveLength(31);
  expect(
    rendered.find((node) => node.props.children === "Loading themes…")?.props
      .className,
  ).toBe("sr-only");
  expect(
    rendered.some((node) => node.props.children === "No themes published yet"),
  ).toBe(false);
});

test("empty search offers a reset that restores the marketplace", () => {
  const view = marketplace({ empty: true });
  const input = view.render().find((node) => node.type === "input")!;
  (input.props.onChange as (event: unknown) => void)({
    target: { value: "Midnight" },
  });
  (
    view.render().find((node) => node.type === "form")!.props.onSubmit as (
      event: unknown,
    ) => void
  )({ preventDefault() {} });
  expect(
    view.render().some((node) => node.props.children === "No matching themes"),
  ).toBe(true);
  view.click("Clear search");
  expect(view.render().find((node) => node.type === "input")!.props.value).toBe(
    "",
  );
  expect(view.key()).toEqual(["theme-marketplace", "", 1, "newest"]);
  expect(
    view
      .render()
      .some((node) => node.props.children === "No themes published yet"),
  ).toBe(true);
});
