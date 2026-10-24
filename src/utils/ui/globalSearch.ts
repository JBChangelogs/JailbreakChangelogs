import Fuse from "fuse.js";
import type { Changelog, PartialItem, Season } from "@/utils/api/api";
import type { ApiSettingsResponse, UserData } from "@/types/auth";
import {
  hasRewardImage,
  rewardImageUrl,
} from "@/components/Seasons/seasonRewards";
import { navigationSections } from "./navigation-menu";
import {
  APP_ONLY_SETTINGS,
  FRONTEND_SETTINGS,
  formatSettingName,
} from "@/config/settings";

export type SearchCatalogItem = PartialItem & { cash_value: string | null };

export const SEARCH_ITEM_FIELDS = ["name", "type", "cash_value"] as const;
export const GLOBAL_SEARCH_GROUP_LIMIT = 5;

export function getGlobalUserQuery(query: string): string | null {
  const trimmed = query.trim();
  if (!trimmed.startsWith("@")) return null;
  return trimmed.slice(1).trim();
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
  searchText?: string;
};

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

export function createGlobalSearchIndex(
  items: SearchCatalogItem[],
  seasons: Season[] = [],
  changelogs: Changelog[] = [],
  settings?: ApiSettingsResponse,
  signedIn = Boolean(settings),
) {
  const settingEntries = [
    ...Object.entries(FRONTEND_SETTINGS)
      .filter(([, setting]) => signedIn || !setting.requiresAccount)
      .map(([id, setting]) => ({
        title: setting.title,
        description: setting.description ?? "",
        target: setting.target ?? id,
      })),
    ...Object.values(signedIn ? (settings ?? {}) : {}).flatMap((category) => [
      {
        title: formatSettingName(category.name),
        description: category.description,
        target: category.name,
      },
      ...category.settings
        .filter((setting) => !APP_ONLY_SETTINGS.has(setting.name))
        .map((setting) => ({
          title: formatSettingName(setting.name),
          description: setting.description,
          target: setting.name,
        })),
    ]),
  ];
  return new Fuse<GlobalSearchResult>(
    [
      ...routes,
      ...settingEntries.map((setting) => ({
        title: setting.title,
        group: "Settings",
        description: setting.description,
        href: `/settings?${new URLSearchParams({ highlight: setting.target })}#${setting.target}`,
        icon: "material-symbols:settings-rounded",
      })),
      ...items.map((item) => ({
        title: item.name,
        group: "Items",
        description: item.type,
        item,
      })),
      ...seasons
        .filter(
          (season) =>
            Array.isArray(season.rewards) && season.rewards.length > 0,
        )
        .flatMap((season): GlobalSearchResult[] => [
          {
            title: `Season ${season.season}: ${season.title}`,
            group: "Seasons",
            description: season.description,
            href: `/seasons/${season.season}`,
            icon: "material-symbols:layers-rounded",
          },
          ...season.rewards.map((reward) => ({
            title: reward.item,
            group: "Rewards",
            description: `Season ${season.season} · ${reward.requirement}`,
            href: `/seasons/${season.season}#reward-${reward.id}`,
            icon: "material-symbols:layers-rounded",
            image: hasRewardImage(reward) ? rewardImageUrl(reward) : undefined,
          })),
        ]),
      ...changelogs.map((changelog) => ({
        title: changelog.title,
        group: "Changelogs",
        description: `Game update ${changelog.id}`,
        searchText: changelog.sections.replace(/<[^>]*>/g, " "),
        href: `/changelogs/${changelog.id}`,
        icon: "material-symbols:article-rounded",
        image: changelog.image_url
          ? `https://assets.jailbreakchangelogs.com${changelog.image_url}`
          : undefined,
      })),
    ],
    {
      keys: [
        { name: "title", weight: 0.75 },
        { name: "description", weight: 0.15 },
        { name: "searchText", weight: 0.1 },
      ],
      threshold: 0.3,
      ignoreLocation: true,
      includeMatches: true,
    },
  );
}

export function getGlobalSearchResults(
  index: Fuse<GlobalSearchResult>,
  query: string,
): GlobalSearchResult[] {
  if (getGlobalUserQuery(query) !== null) return [];
  const term = query.trim().toLowerCase();
  const matches = index.search(term).filter(
    ({ item }) =>
      term.length > 3 ||
      item.title
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.startsWith(term)) ||
      (item.group === "Changelogs" &&
        /^\d+$/.test(term) &&
        item.description === `Game update ${term}`),
  );
  const changelogs = matches
    .filter(({ item }) => item.group === "Changelogs")
    .sort(
      (a, b) =>
        Number(b.matches?.some((match) => match.key === "title")) -
        Number(a.matches?.some((match) => match.key === "title")),
    );
  const ranked = query.trim()
    ? [
        ...matches.filter(({ item }) => item.group !== "Changelogs"),
        ...changelogs,
      ].map(({ item }) => item)
    : routes;
  const counts = new Map<string, number>();
  return ranked.filter((result) => {
    const count = counts.get(result.group) ?? 0;
    counts.set(result.group, count + 1);
    return count < GLOBAL_SEARCH_GROUP_LIMIT;
  });
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
