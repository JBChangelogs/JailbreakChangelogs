import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import {
  ThemeApiError,
  type MarketplaceTheme,
  type ThemePreviewImage,
  type MarketplaceThemesPage,
} from "@/utils/api/userThemes";
import * as marketplaceRealtime from "@/utils/ui/marketplaceRealtime";
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
  unpublishError = false,
  empty = false,
  pending = false,
  fetching = false,
  total = 25,
  previews = [] as ThemePreviewImage[],
  description = null as string | null,
  icon = null as string | null,
  clipboardError = false,
  scrolled = false,
} = {}) {
  const theme: MarketplaceTheme = {
    share_code: "ABCDEFGH",
    label: "Midnight",
    description,
    icon,
    scheme: "dark",
    vars: {},
    logo_filter: null,
    user: { id: author, username: "author" },
    previews,
  };
  const states: unknown[] = [];
  let cursor = 0;
  let queryKey: unknown[] = [];
  const applied: MarketplaceTheme[] = [];
  const recent: string[] = [];
  const errors: unknown[] = [];
  const copied: string[] = [];
  const updates: unknown[] = [];
  const invalidations: unknown[] = [];
  const searchRef = { current: null as { focus: () => void } | null };
  const listeners = new Map<string, (event: unknown) => unknown>();
  let refCursor = 0;
  let scrolls = 0;
  let refetches = 0;
  let cache: MarketplaceThemesPage | undefined;
  let cacheKey = "";
  const marketplaceRef = {
    current: {
      getBoundingClientRect: () => ({ top: scrolled ? -200 : 100 }),
      scrollIntoView: () => {
        scrolls++;
      },
    },
  };
  const client = {
    invalidateQueries: async ({ queryKey }: { queryKey: unknown }) => {
      invalidations.push(queryKey);
    },
    cancelQueries: async () => {},
    getQueryData: () => cache,
    setQueryData: (
      _key: unknown,
      updater: (
        previous: MarketplaceThemesPage | undefined,
      ) => MarketplaceThemesPage | undefined,
    ) => {
      cache = updater(cache);
      return cache;
    },
  };
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
      navigator: {
        clipboard: {
          writeText: async (value: string) => {
            if (clipboardError) throw new Error("Clipboard unavailable");
            copied.push(value);
          },
        },
      },
      window: {
        addEventListener: (
          name: string,
          callback: (event: unknown) => unknown,
        ) => {
          listeners.set(name, callback);
        },
        removeEventListener: (
          name: string,
          callback: (event: unknown) => unknown,
        ) => {
          if (listeners.get(name) === callback) listeners.delete(name);
        },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useRef: () => (refCursor++ === 0 ? searchRef : marketplaceRef),
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
                  const next =
                    typeof value === "function" ? value(states[index]) : value;
                  if (states[index] !== next) dirty = true;
                  states[index] = next;
                },
              ];
            },
          };
        if (name === "@tanstack/react-query")
          return {
            useQueryClient: () => client,
            useQuery: (options: { queryKey: unknown[] }) => {
              queryKey = options.queryKey;
              const nextKey = JSON.stringify(queryKey);
              if (cacheKey !== nextKey) {
                cacheKey = nextKey;
                cache = pending
                  ? undefined
                  : {
                      items: empty ? [] : [theme],
                      total: empty ? 0 : total,
                      page: Number(states[2]),
                      total_pages: empty ? 0 : 2,
                      size: 24,
                    };
              }
              return {
                data: cache,
                refetch: async () => {
                  refetches++;
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
        if (name === "@/components/Users/UserProfilePopover")
          return { UserProfilePopover: "UserProfilePopover" };
        if (name === "@/utils/ui/marketplaceRealtime")
          return marketplaceRealtime;
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
              loading: () => 1,
              success: () => {},
              error: (_title: string, detail: unknown) => errors.push(detail),
            },
          };
        if (name === "next/link") return { default: "Link" };
        if (name === "@/components/Settings/ThemeShareCode")
          return { default: "ThemeShareCode" };
        if (name === "@/components/Settings/ReportThemeButton")
          return { default: "ReportThemeButton" };
        if (name === "@/components/Settings/ThemeIconPicker")
          return { DEFAULT_THEME_ICON: "lucide:palette" };
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
      refCursor = 0;
      effectCursor = 0;
      dirty = false;
      rendered = nodes(exports.default());
    } while (dirty);
    return rendered;
  };
  const button = (label: string) =>
    render().find(
      (node) =>
        node.type === "Button" && [node.props.children].flat().includes(label),
    )!;
  const click = (label: string) =>
    (button(label).props.onClick as () => void)();
  return {
    render,
    button,
    click,
    applied,
    recent,
    errors,
    copied,
    updates,
    invalidations,
    keydown: (event: Partial<KeyboardEvent>) =>
      listeners.get("keydown")?.(event),
    emitMarketplace: async (detail: unknown) => {
      render();
      await listeners.get("realtimeThemeMarketplace")?.({ detail });
      return render();
    },
    cache: () => cache,
    scrolls: () => scrolls,
    refetches: () => refetches,
    cleanup: () => effects.forEach((effect) => effect.cleanup?.()),
    flushDebounce: () => {
      debounced = String(states[0]).trim();
      return render();
    },
    debounceDelay: () => debounceDelay,
    key: () => queryKey,
  };
}

test("marketplace cards show the theme icon and share code", () => {
  for (const icon of [null, "lucide:moon"]) {
    const view = marketplace({ icon });
    const rendered = view.render();
    const heading = rendered.find((node) => node.type === "h2")!;
    expect(
      nodes(heading).find((node) => node.type === "Icon")!.props.icon,
    ).toBe(icon ?? "lucide:palette");
    expect(
      rendered.find((node) => node.type === "ThemeShareCode")?.props.code,
    ).toBe("ABCDEFGH");
  }
});

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

const liveTheme: MarketplaceTheme = {
  share_code: "K4SZ865G",
  label: "Ocean",
  description: "Soft blue accents",
  scheme: "dark",
  vars: {},
  logo_filter: null,
  published_at: 123,
  user: { id: "other", username: "builder" },
};

test("live publications prepend at the top, updates replace in place, and removals drop cards", async () => {
  const view = marketplace();
  await view.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  expect(view.cache()!.items.map((theme) => theme.share_code)).toEqual([
    liveTheme.share_code,
    "ABCDEFGH",
  ]);
  const edited = { ...liveTheme, label: "Edited ocean" };
  await view.emitMarketplace({
    action: "marketplace_theme_updated",
    data: edited,
  });
  expect(view.cache()!.items[0].label).toBe("Edited ocean");
  await view.emitMarketplace({
    action: "marketplace_theme_removed",
    data: { share_code: liveTheme.share_code },
  });
  expect(view.cache()!.items.map((theme) => theme.share_code)).toEqual([
    "ABCDEFGH",
  ]);
});

test("new themes show the shared update pill when scrolled down or viewing another page", async () => {
  for (const scrolled of [true, false]) {
    const view = marketplace({ scrolled });
    if (!scrolled)
      (
        view.render().find((node) => node.type === "Pagination")!.props
          .onChange as (event: unknown, page: number) => void
      )(null, 2);
    const event = { action: "marketplace_theme_published", data: liveTheme };
    await view.emitMarketplace(event);
    await view.emitMarketplace(event);
    expect(view.cache()!.items).toHaveLength(1);
    const pill = view.render().find((node) => node.type === "UpdatePill")!;
    expect(pill.props.children).toContain("1 new theme");
    (pill.props.onClick as () => void)();
    view.render();
    expect(view.key()).toEqual(["theme-marketplace", "", 1, "newest"]);
    expect(view.scrolls()).toBe(1);
    expect(view.render().some((node) => node.type === "UpdatePill")).toBe(
      false,
    );
    if (scrolled) expect(view.refetches()).toBe(1);
  }
});

test("nonmatching publications and signed-out visitors do not receive live cards or a pill", async () => {
  const guest = marketplace({ signedIn: false });
  await guest.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  expect(guest.cache()!.items).toHaveLength(1);
  const view = marketplace({ scrolled: true });
  (
    view.render().find((node) => node.type === "input")!.props.onChange as (
      event: unknown,
    ) => void
  )({ target: { value: "No match" } });
  view.flushDebounce();
  await view.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  expect(view.render().some((node) => node.type === "UpdatePill")).toBe(false);
  expect(view.cache()!.items).toHaveLength(1);
});

test("a removed queued theme disappears from the new-theme count", async () => {
  const view = marketplace({ scrolled: true });
  await view.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  await view.emitMarketplace({
    action: "marketplace_theme_removed",
    data: { share_code: liveTheme.share_code },
  });
  expect(view.render().some((node) => node.type === "UpdatePill")).toBe(false);
});

test("oldest sort queues new publications and the pill returns to newest sort", async () => {
  const view = marketplace();
  (
    view.render().find((node) => node.type === "DropdownMenuRadioGroup")!.props
      .onValueChange as (value: string) => void
  )("oldest");
  await view.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  expect(view.cache()!.items).toHaveLength(1);
  (
    view.render().find((node) => node.type === "UpdatePill")!.props
      .onClick as () => void
  )();
  view.render();
  expect(view.key()).toEqual(["theme-marketplace", "", 1, "newest"]);
});

test("live publications match descriptions and queue edits can stop matching the search", async () => {
  const view = marketplace({ scrolled: true });
  (
    view.render().find((node) => node.type === "input")!.props.onChange as (
      event: unknown,
    ) => void
  )({ target: { value: "Soft blue" } });
  view.flushDebounce();
  await view.emitMarketplace({
    action: "marketplace_theme_published",
    data: liveTheme,
  });
  expect(view.render().some((node) => node.type === "UpdatePill")).toBe(true);
  await view.emitMarketplace({
    action: "marketplace_theme_updated",
    data: { ...liveTheme, description: "Red accents" },
  });
  expect(view.render().some((node) => node.type === "UpdatePill")).toBe(false);
});

test("marketplace descriptions are clamped and absent for null descriptions", () => {
  const description = "Soft purple accents";
  const rendered = marketplace({ description }).render();
  expect(
    rendered.find((node) => node.props.children === description)!.props
      .className,
  ).toContain("line-clamp-3");
  expect(
    marketplace()
      .render()
      .some((node) => String(node.props.className).includes("line-clamp-3")),
  ).toBe(false);
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

test("marketplace detail links cover the card while its controls stay above the link", () => {
  const rendered = marketplace().render();
  const link = rendered.find(
    (node) => node.type === "Link" && node.props.href === "/themes/ABCDEFGH",
  )!;
  expect(link.props.className).toContain("after:inset-0");
  expect(link.props.className).toContain("focus-visible:after:ring-2");
  expect(
    rendered.find((node) => node.type === "article")?.props.className,
  ).toContain("relative isolate");
  const author = rendered.find(
    (node) => node.type === "Link" && node.props.href === "/users/other",
  )!;
  expect(author.props.className).toContain("relative z-10");
  expect(author.props.prefetch).toBe(false);
  const popover = rendered.find((node) => node.type === "UserProfilePopover")!;
  expect((popover.props.user as MarketplaceTheme["user"])?.id).toBe("other");
  expect(nodes(popover.props.children)).toContain(author);
  expect(marketplace().button("Use theme").props.className).toContain(
    "relative z-10",
  );
  const report = rendered.find((node) => node.type === "ReportThemeButton")!;
  expect(report.props.className).toContain("relative z-10");
  expect((report.props.theme as MarketplaceTheme).share_code).toBe("ABCDEFGH");
  expect(
    marketplace({ author: "me" }).button("Remove from marketplace").props
      .className,
  ).toContain("relative z-10");
});

test("uploaded screenshots replace the generated marketplace preview", () => {
  const previews: ThemePreviewImage[] = [
    {
      id: "abc",
      url: "https://uploads.jailbreakchangelogs.com/theme-previews/ABCDEFGH/abc.webp",
      kind: "mobile",
    },
  ];
  const rendered = marketplace({ previews }).render();
  expect(
    rendered.find((node) => node.props.previews === previews)?.props.label,
  ).toBe("Midnight");
  expect(rendered.some((node) => node.props.compact === true)).toBe(false);
  expect(
    marketplace()
      .render()
      .some((node) => node.props.compact === true),
  ).toBe(true);
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
  expect(view.errors).toEqual([{ id: 1, description: "API unavailable" }]);
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
