"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/IconWrapper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMyThemes } from "@/utils/api/userThemes";
import { themePreview } from "@/utils/ui/themeOptions";
import { toast } from "sonner";
import { useOmniSearch } from "@/hooks/useOmniSearch";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTwemoji } from "@/contexts/TwemojiContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  getDesktopNavigation,
  getDesktopSidebarBehavior,
  getLayoutShortcutHidden,
  setDesktopNavigation,
  setDesktopSidebarBehavior,
  setLayoutShortcutHidden,
} from "@/utils/ui/desktopNavigation";
import { getTabStyle, setTabStyle } from "@/utils/ui/tabStyle";
import {
  getThemeCursorEnabled,
  setThemeCursorEnabled,
} from "@/utils/ui/themeCursor";
import {
  getThemeShortcutHidden,
  setThemeShortcutHidden,
} from "@/utils/ui/themeOptions";
import { ThemePreview } from "@/components/Settings/ThemeSettings";
import type { ThemePreview as Preview } from "@/utils/ui/themeOptions";
import { updateUserSettings } from "@/services/settingsService";
import { fetchSharedTheme } from "@/utils/api/userThemes";
import { setCustomTheme } from "@/utils/ui/customTheme";
import {
  fetchOmniSearch,
  SearchRateLimitError,
  type OmniResult,
  type OmniTheme,
} from "@/utils/api/omniSearch";
import { getItemHref } from "@/components/Values/ValuesSearchSuggestions";
import { ItemUnlockBadges } from "@/components/Items/ItemUnlockBadges";
import { hasSeason } from "@/utils/items/season";
import {
  CategoryIconBadge,
  getCategoryColor,
} from "@/utils/items/categoryIcons";
import { getItemImagePath, handleImageError } from "@/utils/ui/images";
import { formatFullValue } from "@/utils/trading/values";
import { UserAvatar } from "@/utils/ui/avatar";
import { UserBadges } from "@/components/Profile/UserBadges";
import { RobloxIcon } from "@/components/Icons/RobloxIcon";
import { trackEvent } from "@/utils/analytics/rybbit";
import {
  createGlobalSearchIndex,
  getGlobalSearchResults,
  getOmniSearchResults,
  OMNI_GROUP_LABELS,
  parseSearchFilter,
  filteredQuery,
  SEARCH_FILTERS,
  searchResultKey,
  getSearchHistory,
  rememberSearch,
  clearSearchHistory,
  splitQueryMatches,
  snippetLine,
  getGlobalUserQuery,
  getGlobalCheckQuery,
  GLOBAL_SEARCH_GROUP_LIMIT,
  type GlobalSearchResult,
} from "@/utils/ui/globalSearch";

/**
 * The guide's special searches, as /v2/search and the Roblox checkers
 * understand them. Each example is [shown, what clicking it types].
 */
const SEARCH_TIPS: {
  examples: [string, string][];
  text: string;
  signedIn?: boolean;
}[] = [
  { examples: [["item:", "item:"]], text: "Items" },
  {
    examples: [
      ["user:", "user:"],
      ["@", "@"],
    ],
    text: "Users",
  },
  { examples: [["season:", "season:"]], text: "Seasons" },
  { examples: [["changelog:", "changelog:"]], text: "Changelogs" },
  { examples: [["reward:", "reward:"]], text: "Rewards" },
  { examples: [["server:", "server:"]], text: "Private servers" },
  { examples: [["theme:", "theme:"]], text: "Themes" },
  { examples: [["setting:", "setting:"]], text: "Settings", signedIn: true },
  {
    examples: [
      ["inv:", "inv:"],
      ["dupe:", "dupe:"],
      ["og:", "og:"],
    ],
    text: "Roblox lookups",
  },
];

/** A theme in the picker a keyword search shows: its colors, then its name. */
function ThemePickerCard({
  result,
  active,
  highlighted,
  preview,
  onApply,
  ...props
}: {
  result: GlobalSearchResult;
  active: boolean;
  highlighted: boolean;
  /** Site themes' colors; custom themes show their icon instead. */
  preview?: Preview;
  onApply: () => void;
  onFocus: () => void;
  onPointerMove: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onApply}
      className={`border-border-card focus-visible:ring-link flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow] focus-visible:ring-2 focus-visible:outline-none ${active ? "border-button-info ring-button-info/30 ring-2" : highlighted ? "border-border-focus" : ""}`}
      {...props}
    >
      {preview ? (
        <ThemePreview preview={preview} compact />
      ) : (
        <span className="bg-tertiary-bg text-secondary-text flex h-12 items-center justify-center">
          <Icon icon={result.icon!} className="size-5" />
        </span>
      )}
      <span
        className={`border-border-card flex min-h-10 items-center gap-2 border-t px-2 py-1.5 text-sm ${active ? "bg-button-info/10" : ""}`}
      >
        <span className="text-primary-text min-w-0 flex-1 truncate font-medium">
          {result.title}
        </span>
        {result.theme?.custom && (
          <span className="text-secondary-text text-[10px] font-semibold uppercase">
            Custom
          </span>
        )}
        {active && (
          <Icon icon="heroicons:check" className="text-link size-4 shrink-0" />
        )}
      </span>
    </button>
  );
}

/**
 * A switch's look without its button: the row itself is the control (a
 * button can't hold another), and its aria-pressed carries the state.
 */
function SwitchIndicator({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${on ? "border-button-info bg-button-info" : "border-[color-mix(in_srgb,var(--color-border-card),white_10%)] bg-[color-mix(in_srgb,var(--color-tertiary-bg),white_8%)]"}`}
    >
      <span
        className={`block size-4 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
      />
    </span>
  );
}

/** A result: a link, or a button when it acts in place (a theme, a setting). */
function ResultRow({
  result,
  onClose,
  onAction,
  plain,
  pressed,
  ...props
}: {
  result: GlobalSearchResult;
  onClose: () => void;
  onAction?: () => void;
  /** No link or action of its own: a control inside it does the work. */
  plain?: boolean;
  /** A setting's current value, for screen readers. */
  pressed?: boolean;
  onFocus: () => void;
  onPointerMove: () => void;
  className: string;
  children: React.ReactNode;
}) {
  if (plain) return <div {...props} />;
  if (onAction)
    return (
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onAction}
        {...props}
      />
    );
  if (result.external)
    return (
      <a
        href={result.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        {...props}
      />
    );
  return (
    <Link
      href={result.item ? getItemHref(result.item) : result.href!}
      prefetch={false}
      onClick={onClose}
      {...props}
    />
  );
}

export default function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef(document.activeElement);
  const resultsRef = useRef<HTMLDivElement>(null);
  const trackedOpenRef = useRef(false);
  // Settings switched here, shown at once while the save runs.
  const [settingOverrides, setSettingOverrides] = useState<
    Record<string, boolean>
  >({});
  const { user } = useAuthContext();
  const {
    theme: siteTheme,
    setTheme,
    customTheme,
    themes: siteThemes,
  } = useTheme();
  const queryClient = useQueryClient();
  // A typed filter ("item:", "@") becomes a chip; `query` is the text after it.
  const [filter, setFilter] = useState<string | null>(null);
  const fullQuery = filteredQuery(filter, query);
  const typeQuery = (value: string) => {
    const parsed = filter ? null : parseSearchFilter(value);
    if (parsed) setFilter(parsed.filter);
    setQuery(parsed ? parsed.text : value);
    setHighlighted(0);
  };
  // Filters the start of the box could become ("se" → season, server,
  // setting), while no filter is set yet. Settings need an account.
  const typedWord = query.trim().toLowerCase();
  const filterSuggestions =
    !filter && /^[a-z]+$/.test(typedWord)
      ? Object.keys(SEARCH_FILTERS).filter(
          (key) =>
            (key.startsWith(typedWord) || `${key}s`.startsWith(typedWord)) &&
            (user || key !== "setting"),
        )
      : [];
  const userQuery = getGlobalUserQuery(fullQuery);
  const checkQuery = getGlobalCheckQuery(fullQuery);
  // "@" alone has nothing to look up yet; "@name" goes to the API as typed.
  const searchEnabled = !checkQuery && (userQuery === null || !!userQuery);
  const search = useOmniSearch(fullQuery, {
    limit: GLOBAL_SEARCH_GROUP_LIMIT,
    enabled: searchEnabled,
    userId: user?.id,
  });
  const isLoading = searchEnabled && search.isPending;
  const hasError = searchEnabled && search.isError;
  const index = useMemo(() => createGlobalSearchIndex(Boolean(user)), [user]);
  const localResults = useMemo(
    // A filter limits results to its API group.
    () => (filter ? [] : getGlobalSearchResults(index, query, user?.roblox_id)),
    [index, query, filter, user?.roblox_id],
  );
  // "Show more" pages, per API group, for the query they were loaded for.
  const [more, setMore] = useState<{
    query: string;
    groups: Record<
      string,
      { page: number; results: OmniResult[]; hasMore: boolean }
    >;
  }>({ query: "", groups: {} });
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  useEffect(() => setHistory(getSearchHistory()), []);
  // Recent shows 3 until expanded.
  const [allRecent, setAllRecent] = useState(false);
  const term = fullQuery.trim();
  const extra = more.query === term ? more.groups : {};
  const groups = ((searchEnabled && term && search.data) || []).map(
    (group) => ({
      ...group,
      results: [...group.results, ...(extra[group.group]?.results ?? [])],
      has_more: extra[group.group]?.hasMore ?? group.has_more,
    }),
  );
  // A keyword search ("theme", "settings") puts the whole group first.
  const apiResults = getOmniSearchResults(groups);
  // An empty search starts with your recent searches, above the quick links.
  const recentResults: GlobalSearchResult[] = fullQuery.trim()
    ? []
    : history.slice(0, allRecent ? undefined : 3).map((entry) => ({
        title: entry,
        group: "Recent",
        description: "",
        icon: "lucide:history",
        recentQuery: entry,
      }));
  const results = [
    ...recentResults,
    ...apiResults.filter((result) => result.expanded),
    ...localResults,
    ...apiResults.filter((result) => !result.expanded),
  ];
  const runSearch = (value: string) => {
    const parsed = parseSearchFilter(value);
    setFilter(parsed?.filter ?? null);
    setQuery(parsed ? parsed.text : value);
    setHighlighted(0);
    inputRef.current?.focus();
  };
  const showMore = async (group: string) => {
    const page = (extra[group]?.page ?? 1) + 1;
    setLoadingMore(group);
    try {
      const [next] = await fetchOmniSearch(
        term,
        GLOBAL_SEARCH_GROUP_LIMIT,
        undefined,
        { group, page },
      );
      setMore((current) => {
        const kept = current.query === term ? current.groups : {};
        return {
          query: term,
          groups: {
            ...kept,
            [group]: {
              page,
              results: [
                ...(kept[group]?.results ?? []),
                ...(next?.results ?? []),
              ],
              hasMore: !!next?.has_more,
            },
          },
        };
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search failed");
    } finally {
      setLoadingMore(null);
    }
  };
  const itemsHaveMore = groups.some(
    (group) => group.group === "items" && group.has_more,
  );

  // Your themes' colors for their swatches (the API sends none), from the
  // same list the settings page loads, once any are on screen.
  const myThemes = useQuery({
    queryKey: ["my-themes", user?.id],
    queryFn: listMyThemes,
    enabled: !!user && results.some((result) => result.theme?.custom),
  });
  const customPreview = (shareCode?: string) => {
    const mine = myThemes.data?.themes.find(
      (theme) => theme.share_code === shareCode,
    );
    return mine ? themePreview(mine.vars) : undefined;
  };
  const isActiveTheme = (theme: OmniTheme) =>
    theme.custom
      ? customTheme?.share_code === theme.share_code
      : !customTheme && siteTheme === theme.slug;
  const applyTheme = async (theme: OmniTheme) => {
    try {
      if (!theme.custom) setTheme(theme.slug!);
      else setCustomTheme(await fetchSharedTheme(theme.share_code!));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn't apply that theme",
      );
    }
  };
  // Browser-side preferences, changed the way the settings page does. A
  // switch flips; a choice steps to its next option.
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const { twemojiEnabled, setTwemojiEnabled } = useTwemoji();
  const canSwitchNavigation = useMediaQuery("(min-width: 1536px)");
  type Preference =
    | { on: boolean; set: (on: boolean) => void }
    | {
        options: { value: string; label: string }[];
        value: string;
        set: (value: string) => void;
        disabled?: boolean;
      };
  const preferenceControl = (id?: string): Preference | null => {
    switch (id) {
      case "theme-cursor":
        return { on: getThemeCursorEnabled(), set: setThemeCursorEnabled };
      case "theme-shortcut":
        return {
          on: !getThemeShortcutHidden(),
          set: (on: boolean) => setThemeShortcutHidden(!on),
        };
      case "navigation-shortcut":
        return {
          on: !getLayoutShortcutHidden(),
          set: (on: boolean) => setLayoutShortcutHidden(!on),
        };
      case "twemoji_enabled":
        return { on: twemojiEnabled, set: setTwemojiEnabled };
      case "navigation-layout":
        return {
          options: [
            { value: "sidebar", label: "Sidebar" },
            { value: "top-bar", label: "Top bar" },
          ],
          value: getDesktopNavigation(),
          set: (value: string) =>
            setDesktopNavigation(value as "sidebar" | "top-bar"),
          // Like the settings page: only wide screens can switch.
          disabled: !canSwitchNavigation,
        };
      case "sidebar-behavior":
        return {
          options: [
            { value: "expanded", label: "Always expanded" },
            { value: "hover", label: "Expand on hover" },
            { value: "compact", label: "Compact" },
          ],
          value: getDesktopSidebarBehavior(),
          set: (value: string) =>
            setDesktopSidebarBehavior(
              value as "expanded" | "hover" | "compact",
            ),
        };
      case "tab-style":
        return {
          options: [
            { value: "underline", label: "Underline" },
            { value: "filled", label: "Filled" },
          ],
          value: getTabStyle(),
          set: (value: string) => setTabStyle(value as "underline" | "filled"),
        };
      default:
        return null;
    }
  };
  const changePreference = (control: Preference) => {
    if ("on" in control) control.set(!control.on);
    rerender();
  };
  const settingValue = (result: GlobalSearchResult) =>
    settingOverrides[result.setting!.name] ?? result.setting!.value;
  const toggleSetting = async (result: GlobalSearchResult) => {
    const { name } = result.setting!;
    const next = !settingValue(result);
    setSettingOverrides((current) => ({ ...current, [name]: next }));
    try {
      await updateUserSettings(name, next);
      void queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["omni-search"] });
    } catch (error) {
      setSettingOverrides((current) => ({ ...current, [name]: !next }));
      toast.error(
        error instanceof Error ? error.message : "Failed to update setting",
      );
    }
  };
  const activeIndex = Math.min(highlighted, results.length - 1);
  const groupNames = [...new Set(results.map((result) => result.group))];
  const orderedResults = groupNames.flatMap((group) =>
    results.filter((result) => result.group === group),
  );

  useEffect(() => {
    resultsRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, query]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        data-global-search-dialog
        className="top-[10dvh] flex h-[min(40rem,80dvh)] max-h-[80dvh] w-[calc(100%-2rem)] max-w-2xl translate-y-0 flex-col gap-0 overflow-hidden p-0"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
          if (!trackedOpenRef.current) {
            trackEvent("Global Search Opened");
            trackedOpenRef.current = true;
          }
        }}
        onKeyDown={(event) => {
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            inputRef.current?.focus();
            if (orderedResults.length)
              setHighlighted(
                (previous) =>
                  (Math.min(previous, orderedResults.length - 1) +
                    (event.key === "ArrowDown" ? 1 : -1) +
                    orderedResults.length) %
                  orderedResults.length,
              );
          }
          if (
            event.key === "Enter" &&
            event.target === inputRef.current &&
            activeIndex >= 0
          ) {
            event.preventDefault();
            const control = resultsRef.current?.querySelector<HTMLElement>(
              `#global-search-result-${activeIndex} :is(a, button)`,
            );
            // A dropdown opens on a key press, not a click: hand it the Enter.
            if (control?.getAttribute("aria-haspopup") === "menu") {
              control.focus();
              control.dispatchEvent(
                new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
              );
            } else control?.click();
          }
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (
            returnFocusRef.current instanceof HTMLElement &&
            returnFocusRef.current.isConnected
          )
            returnFocusRef.current.focus();
        }}
      >
        <DialogTitle className="sr-only">Search the site</DialogTitle>
        <div className="border-border-card relative flex shrink-0 items-center gap-3 border-b px-4">
          <Icon
            icon="heroicons:magnifying-glass"
            className="text-secondary-text size-5 shrink-0"
          />
          {filter && (
            <span className="bg-button-info/15 text-link inline-flex shrink-0 items-center gap-1 rounded-md py-1 pr-1 pl-2 text-xs font-semibold">
              {OMNI_GROUP_LABELS[filter]}
              <button
                type="button"
                aria-label={`Remove the ${OMNI_GROUP_LABELS[filter]} filter`}
                onClick={() => {
                  setFilter(null);
                  setHighlighted(0);
                  inputRef.current?.focus();
                }}
                className="hover:bg-button-info/20 focus-visible:ring-link cursor-pointer rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
              >
                <Icon icon="heroicons:x-mark" className="size-3.5" />
              </button>
            </span>
          )}
          <input
            ref={inputRef}
            role="combobox"
            aria-label="Search pages, items, users, seasons, changelogs, servers, settings and themes"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="global-search-results"
            aria-describedby="global-search-hint"
            aria-activedescendant={
              activeIndex >= 0
                ? `global-search-result-${activeIndex}`
                : undefined
            }
            className="text-primary-text placeholder:text-secondary-text h-16 min-w-0 flex-1 bg-transparent outline-none"
            placeholder={
              filter
                ? `Search ${OMNI_GROUP_LABELS[filter].toLowerCase()}…`
                : "What are you looking for?"
            }
            value={query}
            onChange={(event) => typeQuery(event.target.value)}
            onKeyDown={(event) => {
              // Backspace on an empty box removes the filter chip.
              if (event.key === "Backspace" && filter && !query) {
                event.preventDefault();
                setFilter(null);
              }
              // Tab takes the first suggested filter.
              if (event.key === "Tab" && filterSuggestions.length) {
                event.preventDefault();
                typeQuery(`${filterSuggestions[0]}:`);
              }
            }}
          />
          {filterSuggestions.length > 0 && (
            <div
              role="listbox"
              aria-label="Filters"
              className="border-border-card bg-secondary-bg absolute top-full left-12 z-10 mt-1 w-64 rounded-lg border p-1 shadow-lg"
            >
              {filterSuggestions.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  role="option"
                  aria-selected={index === 0}
                  // Keep focus in the search box.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => typeQuery(`${key}:`)}
                  className={`hover:bg-quaternary-bg flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${index === 0 ? "bg-tertiary-bg" : ""}`}
                >
                  <span className="text-primary-text font-mono">{key}:</span>
                  <span className="text-secondary-text flex-1 text-xs">
                    {OMNI_GROUP_LABELS[SEARCH_FILTERS[key]]}
                  </span>
                  {index === 0 && (
                    <kbd className="border-border-card bg-primary-bg text-secondary-text rounded border px-1.5 py-0.5 font-sans text-[10px] leading-none">
                      Tab
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="text-secondary-text hover:text-primary-text focus-visible:ring-link cursor-pointer rounded-md p-2 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Icon icon="heroicons:x-mark" className="size-5" />
          </button>
        </div>
        <div
          ref={resultsRef}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2"
        >
          <div
            id="global-search-results"
            role="listbox"
            aria-label="Search results"
            // Using a result (a link, an action, Enter) saves the search.
            onClickCapture={(event) => {
              const target = (event.target as HTMLElement).closest("a, button");
              if (target && !target.hasAttribute("data-no-history"))
                rememberSearch(fullQuery);
            }}
          >
            {groupNames.map((group) => {
              const picker = orderedResults.some(
                (result) =>
                  result.group === group && result.theme && result.expanded,
              );
              return (
                <div key={group} role="group" aria-label={group}>
                  <div className="flex items-center justify-between px-3 pt-3 pb-2">
                    <p
                      className="text-secondary-text text-xs font-medium"
                      aria-hidden="true"
                    >
                      {group}
                    </p>
                    {group === "Recent" && (
                      <span className="flex items-center gap-3">
                        {history.length > 3 && (
                          <button
                            type="button"
                            data-no-history
                            onClick={() => setAllRecent((all) => !all)}
                            className="text-secondary-text hover:text-primary-text focus-visible:ring-link cursor-pointer rounded text-xs focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {allRecent ? "Show less" : "View all"}
                          </button>
                        )}
                        <button
                          type="button"
                          data-no-history
                          onClick={() => {
                            clearSearchHistory();
                            setHistory([]);
                          }}
                          className="text-secondary-text hover:text-primary-text focus-visible:ring-link cursor-pointer rounded text-xs focus-visible:ring-2 focus-visible:outline-none"
                        >
                          Clear
                        </button>
                      </span>
                    )}
                  </div>
                  <div
                    className={
                      picker
                        ? "grid grid-cols-2 gap-2 px-1 pb-1 sm:grid-cols-3"
                        : undefined
                    }
                  >
                    {orderedResults.map((result, position) =>
                      result.group !== group ? null : picker ? (
                        <div
                          key={searchResultKey(result)}
                          id={`global-search-result-${position}`}
                          role="option"
                          aria-selected={position === activeIndex}
                        >
                          <ThemePickerCard
                            result={result}
                            active={
                              !!result.theme && isActiveTheme(result.theme)
                            }
                            highlighted={position === activeIndex}
                            preview={
                              result.theme?.custom
                                ? customPreview(result.theme.share_code)
                                : siteThemes.find(
                                    (option) =>
                                      option.value === result.theme?.slug,
                                  )?.preview
                            }
                            onApply={() => void applyTheme(result.theme!)}
                            onFocus={() => setHighlighted(position)}
                            onPointerMove={() => setHighlighted(position)}
                          />
                        </div>
                      ) : (
                        <div
                          key={searchResultKey(result)}
                          id={`global-search-result-${position}`}
                          role="option"
                          aria-selected={position === activeIndex}
                          className="relative"
                        >
                          <ResultRow
                            result={result}
                            onClose={onClose}
                            onAction={
                              result.recentQuery
                                ? () => runSearch(result.recentQuery!)
                                : result.theme
                                  ? () => void applyTheme(result.theme!)
                                  : result.setting
                                    ? () => void toggleSetting(result)
                                    : (() => {
                                          const control = preferenceControl(
                                            result.preference,
                                          );
                                          return !!control && "on" in control;
                                        })()
                                      ? () =>
                                          changePreference(
                                            preferenceControl(
                                              result.preference,
                                            )!,
                                          )
                                      : undefined
                            }
                            plain={(() => {
                              const control = preferenceControl(
                                result.preference,
                              );
                              return !!control && !("on" in control);
                            })()}
                            pressed={
                              result.setting
                                ? settingValue(result)
                                : (() => {
                                    const control = preferenceControl(
                                      result.preference,
                                    );
                                    return control && "on" in control
                                      ? control.on
                                      : undefined;
                                  })()
                            }
                            onFocus={() => setHighlighted(position)}
                            onPointerMove={() => setHighlighted(position)}
                            className={`text-primary-text focus-visible:ring-link flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg py-2 pr-3 pl-3 text-left focus-visible:ring-2 focus-visible:outline-none ${result.shortcuts ? (result.item || position !== activeIndex ? "pr-20" : result.shortcuts.length > 1 ? "pr-[22rem]" : "pr-56") : ""} ${position === activeIndex ? "bg-tertiary-bg" : ""}`}
                          >
                            {result.user ? (
                              <UserAvatar
                                userId={result.user.id}
                                avatarHash={result.user.avatar}
                                username={result.user.username}
                                size={9}
                                cdnSize={64}
                                custom_avatar={result.user.custom_avatar}
                                settings={result.user.settings_v2}
                                premiumType={result.user.premiumtype}
                                showBadge={false}
                                className="shrink-0"
                              />
                            ) : result.item || result.image ? (
                              <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-md">
                                <Image
                                  src={
                                    result.item
                                      ? getItemImagePath(
                                          result.item.type,
                                          result.item.name,
                                          true,
                                        )
                                      : result.image!
                                  }
                                  alt=""
                                  fill
                                  sizes="80px"
                                  className="object-contain"
                                  onError={handleImageError}
                                />
                              </div>
                            ) : (
                              <Icon
                                icon={result.icon!}
                                className="text-secondary-text size-5 shrink-0"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-medium">
                                  {splitQueryMatches(result.title, query).map(
                                    (part, index) =>
                                      index % 2 ? (
                                        <mark
                                          key={index}
                                          className="text-primary-text bg-transparent font-bold"
                                        >
                                          {part}
                                        </mark>
                                      ) : (
                                        part
                                      ),
                                  )}
                                </span>
                                {result.user && (
                                  <div className="flex shrink-0 items-center gap-1">
                                    <UserBadges
                                      usernumber={
                                        result.user.usernumber ?? Infinity
                                      }
                                      flags={result.user.flags}
                                      size="sm"
                                      noContainer
                                      limit={1}
                                      disableClick
                                    />
                                    <UserBadges
                                      usernumber={Infinity}
                                      premiumType={result.user.premiumtype}
                                      size="sm"
                                      noContainer
                                      limit={1}
                                      disableClick
                                    />
                                  </div>
                                )}
                              </div>
                              {result.item && (
                                <div className="mt-1 flex flex-wrap items-center gap-1">
                                  <span
                                    className="text-primary-text inline-flex h-6 items-center gap-1.5 rounded-md border px-2.5 text-xs leading-none font-medium"
                                    style={{
                                      borderColor: getCategoryColor(
                                        result.item.type,
                                      ),
                                      backgroundColor: `${getCategoryColor(result.item.type)}22`,
                                    }}
                                  >
                                    <CategoryIconBadge
                                      type={result.item.type}
                                      isLimited={false}
                                      isSeasonal={false}
                                      preferItemType
                                      withContainer={false}
                                      className="h-3 w-3"
                                    />
                                    {result.item.type}
                                  </span>
                                  {result.item.is_limited === 1 && (
                                    <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                                      <Icon
                                        icon="mdi:clock"
                                        className="mr-1.5 h-3 w-3"
                                        style={{ color: "#ffd700" }}
                                      />
                                      Limited
                                    </span>
                                  )}
                                  {hasSeason(result.item) && (
                                    <span className="text-primary-text border-border-card bg-tertiary-bg/40 inline-flex h-6 items-center rounded-md border px-2.5 text-xs leading-none font-medium backdrop-blur-xl">
                                      <Icon
                                        icon="noto-v1:snowflake"
                                        className="mr-1.5 h-3 w-3"
                                        style={{ color: "#40c0e7" }}
                                      />
                                      Seasonal
                                    </span>
                                  )}
                                  <ItemUnlockBadges
                                    season={result.item.season}
                                    level={result.item.level}
                                    className=""
                                  />
                                </div>
                              )}
                              {result.reward && (
                                <ItemUnlockBadges
                                  season={result.reward.season}
                                  level={result.reward.level}
                                  className="mt-1"
                                />
                              )}
                              <span
                                className={`text-secondary-text block truncate text-xs ${!result.item && (result.description || result.snippet) ? "" : "hidden"}`}
                              >
                                {result.snippet
                                  ? splitQueryMatches(
                                      snippetLine(result.snippet, query),
                                      query,
                                    ).map((part, index) =>
                                      index % 2 ? (
                                        <mark
                                          key={index}
                                          className="text-primary-text bg-transparent font-semibold"
                                        >
                                          {part}
                                        </mark>
                                      ) : (
                                        part
                                      ),
                                    )
                                  : result.description}
                              </span>
                            </div>
                            {result.user?.roblox_id &&
                              result.user.roblox_id !== "None" &&
                              result.user.roblox_username &&
                              result.user.roblox_username !== "None" && (
                                <span className="border-border-card bg-tertiary-bg text-secondary-text inline-flex max-w-[40%] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs">
                                  <RobloxIcon className="size-3.5 shrink-0" />
                                  <span className="sr-only">
                                    Connected Roblox account:{" "}
                                  </span>
                                  <span className="truncate">
                                    @{result.user.roblox_username}
                                  </span>
                                </span>
                              )}
                            {result.item && (
                              <span className="bg-button-info text-form-button-text inline-flex h-6 shrink-0 items-center rounded-md px-2 text-xs leading-none font-bold">
                                {formatFullValue(result.item.cash_value)}
                              </span>
                            )}
                            {result.setting && (
                              // The row is the control; this only shows its state.
                              <SwitchIndicator on={settingValue(result)} />
                            )}
                            {(() => {
                              const control = preferenceControl(
                                result.preference,
                              );
                              if (!control) return null;
                              if ("on" in control)
                                return <SwitchIndicator on={control.on} />;
                              // A choice: a dropdown of its options. Enter on
                              // the row opens it (it's the row's only button).
                              return (
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    disabled={control.disabled}
                                    aria-label={`${result.title}: ${control.options.find((option) => option.value === control.value)?.label}`}
                                    className="border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg focus-visible:ring-link inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {
                                      control.options.find(
                                        (option) =>
                                          option.value === control.value,
                                      )?.label
                                    }
                                    <Icon
                                      icon="lucide:chevron-down"
                                      aria-hidden="true"
                                      className="size-3.5"
                                    />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuRadioGroup
                                      value={control.value}
                                      onValueChange={(value) => {
                                        control.set(value);
                                        rerender();
                                      }}
                                    >
                                      {control.options.map((option) => (
                                        <DropdownMenuRadioItem
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </DropdownMenuRadioItem>
                                      ))}
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              );
                            })()}
                            {result.theme && isActiveTheme(result.theme) && (
                              <span className="text-link inline-flex shrink-0 items-center gap-1 text-xs font-medium">
                                <Icon
                                  icon="heroicons:check"
                                  className="size-4"
                                />
                                In use
                              </span>
                            )}
                          </ResultRow>
                          {result.shortcuts && position !== activeIndex && (
                            // Idle: a quiet hint that highlighting shows more.
                            <span
                              aria-hidden="true"
                              className="text-tertiary-text pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1 text-xs"
                            >
                              More
                              <Icon
                                icon="lucide:chevron-right"
                                className="size-3.5"
                              />
                            </span>
                          )}
                          {result.shortcuts && position === activeIndex && (
                            // Shown on the highlighted quick link; Tab reaches
                            // them after the link itself.
                            <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
                              {result.shortcuts.map((shortcut) =>
                                shortcut.query ? (
                                  <Button
                                    key={shortcut.title}
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onFocus={() => setHighlighted(position)}
                                    onClick={() => {
                                      typeQuery(shortcut.query!);
                                      inputRef.current?.focus();
                                    }}
                                  >
                                    {shortcut.title}
                                  </Button>
                                ) : (
                                  <Button
                                    key={shortcut.title}
                                    asChild
                                    variant="secondary"
                                    size="sm"
                                  >
                                    <Link
                                      href={shortcut.href!}
                                      prefetch={false}
                                      aria-label={
                                        result.item ? shortcut.title : undefined
                                      }
                                      title={
                                        result.item ? shortcut.title : undefined
                                      }
                                      onFocus={() => setHighlighted(position)}
                                      onClick={onClose}
                                    >
                                      {result.item ? (
                                        <Icon
                                          icon="heroicons:document-text"
                                          className="size-4"
                                        />
                                      ) : (
                                        shortcut.title
                                      )}
                                    </Link>
                                  </Button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                  {groups
                    .filter(
                      (item) =>
                        item.has_more &&
                        OMNI_GROUP_LABELS[item.group] === group,
                    )
                    .map((item) => (
                      <button
                        key={item.group}
                        type="button"
                        disabled={loadingMore === item.group}
                        data-no-history
                        onClick={() => void showMore(item.group)}
                        className="text-link focus-visible:ring-link mx-3 my-2 block w-fit cursor-pointer rounded text-xs underline focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
                      >
                        {loadingMore === item.group ? "Loading…" : "Show more"}
                      </button>
                    ))}
                  {/* Only with text to search for: "item:" alone lists them all. */}
                  {group === "Items" && itemsHaveMore && query.trim() && (
                    <Link
                      href={`/values?${new URLSearchParams({ query: query.trim() })}`}
                      prefetch={false}
                      onClick={onClose}
                      className="text-link focus-visible:ring-link mx-3 my-2 block w-fit rounded text-xs underline focus-visible:ring-2 focus-visible:outline-none"
                    >
                      View all item results
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
          <div
            role="status"
            className={`text-secondary-text px-3 py-2 text-sm ${!results.length ? "flex flex-1 flex-col items-center justify-center text-center" : ""}`}
          >
            {!results.length &&
              !isLoading &&
              !hasError &&
              (userQuery !== null && !userQuery ? (
                <p>Type a username to search accounts.</p>
              ) : checkQuery ? (
                <p>Type a Roblox username or ID.</p>
              ) : (
                <>
                  <p className="text-primary-text font-medium">
                    No results found
                  </p>
                  <p className="mt-1">
                    Try a different name, or @username for users only.
                  </p>
                </>
              ))}
            {isLoading && <p>Searching…</p>}
            {hasError && (
              <p>
                {search.error instanceof SearchRateLimitError
                  ? search.error.message
                  : "Search failed."}{" "}
                <button
                  type="button"
                  className="text-link cursor-pointer underline"
                  onClick={() => void search.refetch()}
                >
                  Retry
                </button>
              </p>
            )}
          </div>
        </div>
        <div className="text-secondary-text border-border-card flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs">
          <p
            id="global-search-hint"
            className="flex flex-wrap items-center gap-1"
          >
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              ↑
            </kbd>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              ↓
            </kbd>
            <span>to navigate ·</span>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              Enter
            </kbd>
            <span>to open ·</span>
            <kbd className="border-border-card bg-secondary-bg text-primary-text shrink-0 rounded border px-1.5 py-1 font-sans text-xs leading-none">
              Esc
            </kbd>
            <span>to close</span>
          </p>
          <Popover open={tipsOpen} onOpenChange={setTipsOpen}>
            <PopoverTrigger className="text-secondary-text hover:text-primary-text focus-visible:ring-link data-[state=open]:text-primary-text inline-flex cursor-pointer items-center gap-1.5 rounded text-xs focus-visible:ring-2 focus-visible:outline-none">
              <Icon
                icon="lucide:lightbulb"
                aria-hidden="true"
                className="size-3.5"
              />
              Search tips
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              // Above the search dialog (z-10000), like dropdowns.
              className="z-[10001] w-auto p-4"
            >
              <p className="text-primary-text text-sm font-semibold">
                Search tips
              </p>
              <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-xs">
                {SEARCH_TIPS.filter((tip) => user || !tip.signedIn).map(
                  (tip) => (
                    <Fragment key={tip.text}>
                      <dt className="flex flex-wrap gap-1">
                        {tip.examples.map(([label, insert]) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              typeQuery(insert);
                              setTipsOpen(false);
                              inputRef.current?.focus();
                            }}
                            className="border-border-card bg-tertiary-bg text-primary-text hover:bg-quaternary-bg focus-visible:ring-link cursor-pointer rounded-md border px-1.5 py-0.5 font-mono transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {label}
                          </button>
                        ))}
                      </dt>
                      <dd className="text-secondary-text">{tip.text}</dd>
                    </Fragment>
                  ),
                )}
              </dl>
            </PopoverContent>
          </Popover>
        </div>
      </DialogContent>
    </Dialog>
  );
}
