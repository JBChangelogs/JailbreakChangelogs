import Fuse from "fuse.js";
import type { PartialItem } from "@/utils/api/api";
import type { UserData } from "@/types/auth";
import type { OmniGroup, OmniResult, OmniTheme } from "@/utils/api/omniSearch";
import {
  hasRewardImage,
  rewardImageUrl,
} from "@/components/Seasons/seasonRewards";
import { validatePrivateServerLink } from "@/utils/api/serverValidation";
import { navigationSections } from "./navigation-menu";
import { safeLocalStorage } from "@/utils/storage/safeStorage";
import {
  APP_ONLY_SETTINGS,
  FRONTEND_SETTINGS,
  formatSettingName,
} from "@/config/settings";

export type SearchCatalogItem = PartialItem & {
  cash_value: string | null;
  season?: number | null;
  level?: number | string | null;
};

export const GLOBAL_SEARCH_GROUP_LIMIT = 5;

const HISTORY_KEY = "jbcl:search-history";
const HISTORY_LIMIT = 10;

/** Recent searches on this browser, newest first. */
export function getSearchHistory(): string[] {
  try {
    const saved: unknown = JSON.parse(
      safeLocalStorage.getItem(HISTORY_KEY) ?? "[]",
    );
    return Array.isArray(saved)
      ? saved.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

/** Saves a search that was used, moving a repeat to the top. */
export function rememberSearch(query: string): string[] {
  const term = query.trim();
  if (!term) return getSearchHistory();
  const next = [
    term,
    ...getSearchHistory().filter(
      (entry) => entry.toLowerCase() !== term.toLowerCase(),
    ),
  ].slice(0, HISTORY_LIMIT);
  safeLocalStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export function clearSearchHistory() {
  safeLocalStorage.removeItem(HISTORY_KEY);
}

/** The text of a users-only search ("@name" or "user:name"), else null. */
export function getGlobalUserQuery(query: string): string | null {
  const match = query.trim().match(/^(?:@|users?\s*:)\s*(.*)$/i);
  return match ? match[1].trim() : null;
}

/**
 * /v2/search's filters: `type:` (singular or plural) limits results to that
 * group, and `type:` alone lists it. Keyed by prefix, valued by API group.
 */
export const SEARCH_FILTERS: Record<string, string> = {
  item: "items",
  user: "users",
  season: "seasons",
  changelog: "changelogs",
  reward: "rewards",
  server: "servers",
  theme: "themes",
  setting: "settings",
};

/**
 * Splits a typed filter off the front: "items: torp" → items + "torp", and
 * "@name" → users + "name". Anything else (inv:, plain text) stays as is.
 */
export function parseSearchFilter(
  value: string,
): { filter: string; text: string } | null {
  if (value.trimStart().startsWith("@"))
    return { filter: "users", text: value.trimStart().slice(1) };
  const match = value.match(/^\s*([a-z]+?)s?\s*:\s*(.*)$/is);
  const filter = match && SEARCH_FILTERS[match[1].toLowerCase()];
  return filter ? { filter, text: match[2] } : null;
}

/** The query sent to /v2/search for a filter chip and the text after it. */
export const filteredQuery = (filter: string | null, text: string) =>
  filter
    ? `${Object.keys(SEARCH_FILTERS).find((key) => SEARCH_FILTERS[key] === filter)}:${text}`
    : text;

const CHECK_PREFIXES: Record<string, string> = {
  inv: "/inventories",
  dupe: "/dupes",
  og: "/og",
};

export function getGlobalCheckQuery(
  query: string,
): { href: string; target: string } | null {
  const match = query.trim().match(/^(inv|dupe|og):\s*(.*)$/i);
  if (!match) return null;
  return { href: CHECK_PREFIXES[match[1].toLowerCase()], target: match[2] };
}

export type GlobalSearchResult = {
  title: string;
  group: string;
  description: string;
  href?: string;
  icon?: string;
  item?: SearchCatalogItem;
  user?: UserData;
  image?: string;
  /** Opens in a new tab (a Roblox server link). */
  external?: boolean;
  /** A private server's id, for a stable key (titles and links repeat). */
  serverId?: number;
  /** An account setting the row toggles in place. */
  setting?: { name: string; value: boolean };
  /** A theme the row applies in place. */
  theme?: OmniTheme;
  /** A changelog's matched text, shown via `snippetLine`. */
  snippet?: string;
  /** From a whole group the API expanded for a keyword search. */
  expanded?: boolean;
  /** A recent search, run again when chosen. */
  recentQuery?: string;
  /** A quick link's shortcuts, shown on the row while it's highlighted. */
  shortcuts?: QuickLinkShortcut[];
  /** A browser-side preference (FRONTEND_SETTINGS key) changed in place. */
  preference?: string;
};

/**
 * The bullet of a changelog snippet that holds the query: the API's
 * snippet is "- a - b - c" text cut at both ends. An ellipsis stays only
 * where the shown line was cut.
 */
export function snippetLine(snippet: string, query: string): string {
  const cutStart = /^\s*(…|\.\.\.)/.test(snippet);
  const cutEnd = /(…|\.\.\.)\s*$/.test(snippet);
  const lines = snippet
    .replace(/^\s*(…|\.\.\.)|(…|\.\.\.)\s*$/g, "")
    .split(/(?:^|\s)-\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return snippet.trim();
  const term = query.trim().toLowerCase();
  const index = Math.max(
    0,
    lines.findIndex((line) => line.toLowerCase().includes(term)),
  );
  const line = lines[index];
  return `${cutStart && index === 0 ? "…" : ""}${line}${cutEnd && index === lines.length - 1 ? "…" : ""}`;
}

const routes: GlobalSearchResult[] = navigationSections.flatMap((section) =>
  section.items
    .filter((item) => item.badge !== "coming-soon")
    .map((item) => ({
      title: item.title,
      group: section.title,
      description: item.description,
      href: item.href,
      icon: item.icon,
    })),
);

const quickLinks: GlobalSearchResult[] = [
  ...[
    "/values",
    "/values/calculator",
    "/trading",
    "/inventories",
    "/dupes",
    "/og",
    "/changelogs",
  ].flatMap((href) => routes.filter((route) => route.href === href)),
  {
    title: "Settings",
    description: "Manage your account and preferences",
    href: "/settings",
    icon: "material-symbols:settings-rounded",
  },
].map((route) => ({ ...route, group: "Quick links" }));

/**
 * Shortcuts under a quick link. `mine` ones open your own lookup, so they
 * need a connected Roblox account; `query` ones search instead of opening
 * a page.
 */
const QUICK_LINK_CHILDREN: Record<
  string,
  {
    title: string;
    href?: string;
    mine?: string;
    query?: string;
  }[]
> = {
  "/values": [
    {
      title: "Value changelogs",
      href: "/values/changelogs",
    },
  ],
  "/inventories": [
    {
      title: "View my inventory",
      mine: "/inventories",
    },
  ],
  "/og": [{ title: "View my OGs", mine: "/og" }],
  "/changelogs": [
    {
      title: "Changelog timeline",
      href: "/changelogs/timeline",
    },
  ],
  "/settings": [
    { title: "Configure settings", query: "setting:" },
    { title: "Choose a theme", query: "theme:" },
  ],
};

/** A shortcut on a quick link: a page, or (`query`) a search to run. */
export type QuickLinkShortcut = {
  title: string;
  href?: string;
  query?: string;
};

/** The quick links, with the shortcuts that apply to you. */
export function getQuickLinks(robloxId?: string | null): GlobalSearchResult[] {
  const linked = robloxId && robloxId !== "None" ? robloxId : null;
  return quickLinks.map((link) => {
    const shortcuts = (QUICK_LINK_CHILDREN[link.href!] ?? []).flatMap(
      ({ title, href, mine, query }): QuickLinkShortcut[] =>
        mine
          ? linked
            ? [{ title, href: `${mine}/${encodeURIComponent(linked)}` }]
            : []
          : [{ title, href, query }],
    );
    return shortcuts.length ? { ...link, shortcuts } : link;
  });
}

let cachedIndex:
  | { signedIn: boolean; index: Fuse<GlobalSearchResult> }
  | undefined;

/**
 * Pages and this site's own display settings, searched here; everything
 * from the API (items, users, seasons, account settings…) comes from
 * /v2/search instead.
 */
export function createGlobalSearchIndex(signedIn = false) {
  if (cachedIndex?.signedIn === signedIn) return cachedIndex.index;
  const index = new Fuse<GlobalSearchResult>(
    [
      ...routes,
      ...Object.entries(FRONTEND_SETTINGS)
        .filter(([, setting]) => signedIn || !setting.requiresAccount)
        .map(([id, setting]) => {
          const target = setting.target ?? id;
          return {
            title: setting.title,
            group: "Settings",
            description: setting.description ?? "",
            href: `/settings?${new URLSearchParams({ highlight: target })}#${target}`,
            icon: "material-symbols:settings-rounded",
            preference: id,
          };
        }),
    ],
    {
      keys: [
        { name: "title", weight: 0.8 },
        { name: "description", weight: 0.2 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
    },
  );
  cachedIndex = { signedIn, index };
  return index;
}

export function getGlobalSearchResults(
  index: Fuse<GlobalSearchResult>,
  query: string,
  /** Your connected Roblox account, for the quick links' "my" shortcuts. */
  robloxId?: string | null,
): GlobalSearchResult[] {
  if (getGlobalUserQuery(query) !== null) return [];
  const check = getGlobalCheckQuery(query);
  if (check) {
    // Roblox usernames are letters, digits and underscores; IDs are digits.
    if (!/^\w+$/.test(check.target)) return [];
    const route = routes.find((route) => route.href === check.href)!;
    return [
      {
        ...route,
        title: `${route.title}: ${check.target}`,
        group: "Roblox lookup",
        href: `${check.href}/${check.target}`,
      },
    ];
  }
  const term = query.trim().toLowerCase();
  if (!term) return getQuickLinks(robloxId);
  // 1-3 letters must start a word in the title, like the API's rule.
  const ranked = index
    .search(term)
    .filter(
      ({ item }) =>
        term.length > 3 ||
        item.title
          .toLowerCase()
          .split(/\s+/)
          .some((word) => word.startsWith(term)),
    )
    .map(({ item }) => item);
  const counts = new Map<string, number>();
  return ranked.filter((result) => {
    const count = counts.get(result.group) ?? 0;
    counts.set(result.group, count + 1);
    return count < GLOBAL_SEARCH_GROUP_LIMIT;
  });
}

/**
 * Splits `text` around where the typed query appears (case-insensitive), so
 * those parts can be bolded; odd indexes are the matches.
 */
export function splitQueryMatches(text: string, query: string): string[] {
  const term = query.trim().replace(/^@/, "");
  if (!term) return [text];
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.split(new RegExp(`(${escaped})`, "i"));
}

export const OMNI_GROUP_LABELS: Record<string, string> = {
  items: "Items",
  users: "Users",
  seasons: "Seasons",
  rewards: "Rewards",
  changelogs: "Changelogs",
  settings: "Settings",
  servers: "Servers",
  themes: "Themes",
};

/** Shortcut buttons to changelogs, leaving out any without an id. */
function changelogShortcuts(links: [string, number | null | undefined][]): {
  shortcuts?: QuickLinkShortcut[];
} {
  const shortcuts = links.flatMap(([title, id]) =>
    id == null ? [] : [{ title, href: `/changelogs/${id}` }],
  );
  return shortcuts.length ? { shortcuts } : {};
}

/** The newest changelog id, from either API shape. */
const latestChangelog = (result: {
  changelogs?: { id: number }[];
  changelog_ids?: number[];
}) => result.changelogs?.[0]?.id ?? result.changelog_ids?.[0];

/**
 * A row's React key: titles repeat (a custom theme named like a site one,
 * servers sharing an owner or link), so ids are used where they exist.
 */
export function searchResultKey(result: GlobalSearchResult): string {
  if (result.item) return `item-${result.item.id}`;
  if (result.theme)
    return `theme-${result.theme.share_code ?? result.theme.slug}`;
  if (result.serverId != null) return `server-${result.serverId}`;
  return `${result.group}:${result.href}:${result.title}`;
}

/** One /v2/search result as a search row, with the link or action it opens. */
function toResult(result: OmniResult, group: string): GlobalSearchResult[] {
  switch (result.kind) {
    case "item":
      return [
        {
          title: result.name,
          group,
          description:
            result.season != null
              ? `${result.type} · Season ${result.season}`
              : result.type,
          item: {
            id: result.id,
            name: result.name,
            type: result.type,
            cash_value: result.cash_value,
            season: result.season,
            level: result.level,
          },
          ...changelogShortcuts([
            ["Latest changelog", latestChangelog(result)],
          ]),
        },
      ];
    case "user":
      return getGlobalUserResults([result]);
    case "season":
      return [
        {
          title: `Season ${result.season}: ${result.title}`,
          group,
          description: result.description,
          href: `/seasons/${result.season}`,
          icon: "material-symbols:layers-rounded",
          ...changelogShortcuts([
            ["Launch update", result.launch_changelog_id],
            // The latest, unless that's the launch itself.
            [
              "Latest update",
              latestChangelog(result) === result.launch_changelog_id
                ? undefined
                : latestChangelog(result),
            ],
          ]),
        },
      ];
    case "reward":
      return [
        {
          title: result.item,
          group,
          description: `Season ${result.season} · ${result.requirement}`,
          href: `/seasons/${result.season}#reward-${result.id}`,
          icon: "material-symbols:layers-rounded",
          image: hasRewardImage(result) ? rewardImageUrl(result) : undefined,
        },
      ];
    case "changelog":
      return [
        {
          title: result.title,
          group,
          description: [
            `Game update ${result.id}`,
            result.launches_season != null
              ? `Launched Season ${result.launches_season}`
              : result.season != null && `Season ${result.season}`,
          ]
            .filter(Boolean)
            .join(" · "),
          // A body match shows the text it matched instead.
          snippet: result.matched === "body" ? result.snippet : undefined,
          href: `/changelogs/${result.id}`,
          ...(result.season != null && {
            shortcuts: [
              {
                title: result.season_title
                  ? `Season ${result.season}: ${result.season_title}`
                  : `Season ${result.season}`,
                href: `/seasons/${result.season}`,
              },
            ],
          }),
          icon: "material-symbols:article-rounded",
          image: result.image_url
            ? `https://assets.jailbreakchangelogs.com${result.image_url}`
            : undefined,
        },
      ];
    case "setting": {
      if (APP_ONLY_SETTINGS.has(result.name)) return [];
      return [
        {
          title: formatSettingName(result.name),
          group,
          description: result.description,
          href: `/settings?${new URLSearchParams({ highlight: result.name })}#${result.name}`,
          icon: "material-symbols:settings-rounded",
          setting:
            typeof result.value === "boolean"
              ? { name: result.name, value: result.value }
              : undefined,
        },
      ];
    }
    case "server": {
      const owner = result.owner.global_name || result.owner.username;
      const joinable = validatePrivateServerLink(result.link).isValid;
      return [
        {
          title: `${owner}'s server`,
          group,
          description: result.rules || "No rules listed",
          href: joinable ? result.link : "/servers",
          external: joinable,
          serverId: result.id,
        },
      ];
    }
    case "theme":
      return [
        {
          title: result.label,
          group,
          description: result.custom
            ? `Your ${result.scheme} theme`
            : `${result.scheme === "light" ? "Light" : "Dark"} theme`,
          icon:
            result.icon ??
            (result.scheme === "light" ? "lucide:sun" : "lucide:moon"),
          theme: result,
        },
      ];
  }
}

/** /v2/search's groups, in the API's order, as search rows. */
export function getOmniSearchResults(
  groups: OmniGroup[],
): GlobalSearchResult[] {
  return groups.flatMap(({ group, results, expanded }) =>
    results.flatMap((result) =>
      toResult(result, OMNI_GROUP_LABELS[group] ?? group).map((row) =>
        expanded ? { ...row, expanded } : row,
      ),
    ),
  );
}

export function getGlobalUserResults(users: UserData[]): GlobalSearchResult[] {
  return users.map((user) => ({
    title:
      user.global_name && user.global_name !== "None"
        ? user.global_name
        : user.username,
    group: "Users",
    description: `@${user.username}`,
    href: `/users/${encodeURIComponent(user.id)}`,
    user,
  }));
}
