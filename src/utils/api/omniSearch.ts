import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import { parseJsonWithLargeIds } from "@/utils/api/parseJsonWithLargeIds";
import type { Reward } from "@/utils/api/api";
import type { UserData } from "@/types/auth";

// GET /v2/search: items, users, seasons, rewards, changelogs, settings,
// servers and themes in one call, grouped and ranked by the API.

// "keyword": a plain word like "theme" ranked its group first; "filter": a
// bare `type:` listing.
type Matched = "title" | "description" | "body" | "id" | "keyword" | "filter";

export type OmniItem = {
  kind: "item";
  id: number;
  name: string;
  type: string;
  cash_value: string | null;
  season?: number | null;
  level?: number | string | null;
  /** Changelogs that mention it, newest first (or `changelog_ids`, older API). */
  changelogs?: OmniChangelogLink[];
  changelog_ids?: number[];
  matched?: Matched;
};
export type OmniChangelogLink = {
  id: number;
  title: string;
  image_url: string | null;
};
export type OmniUser = UserData & { kind: "user" };
export type OmniSeason = {
  kind: "season";
  season: number;
  title: string;
  description: string;
  /** Its changelogs, newest first (or `changelog_ids`, older API). */
  changelogs?: OmniChangelogLink[];
  changelog_ids?: number[];
  launch_changelog_id?: number | null;
  matched?: Matched;
};
export type OmniReward = Reward & {
  kind: "reward";
  season: number;
  season_title: string;
  matched?: Matched;
};
export type OmniChangelog = {
  kind: "changelog";
  id: number;
  title: string;
  image_url: string | null;
  snippet?: string;
  /** The season it came out in, and the one it launched, if any. */
  season?: number | null;
  season_title?: string | null;
  launches_season?: number | null;
  matched?: Matched;
};
export type OmniSetting = {
  kind: "setting";
  name: string;
  description: string;
  category: string;
  /** Signed-in users' current value. */
  value?: boolean;
  matched?: Matched;
};
export type OmniServer = {
  kind: "server";
  id: number;
  link: string;
  rules: string;
  owner: { id: string; username: string; global_name?: string | null };
  matched?: Matched;
};
export type OmniTheme = {
  kind: "theme";
  label: string;
  icon: string | null;
  scheme: "light" | "dark";
  /** A user's own theme; else a site theme, applied by slug. */
  custom: boolean;
  slug?: string;
  share_code?: string;
  matched?: Matched;
};

export type OmniResult =
  | OmniItem
  | OmniUser
  | OmniSeason
  | OmniReward
  | OmniChangelog
  | OmniSetting
  | OmniServer
  | OmniTheme;

export type OmniGroup = {
  group: string;
  results: OmniResult[];
  has_more: boolean;
  /**
   * The whole group, for a keyword search ("theme", "settings"): shown
   * first, and themes as a picker.
   */
  expanded?: boolean;
};

/** All groups' best matches, or with `group`, one group's `page`. */
/** Over /v2/search's 120 requests a minute. */
export class SearchRateLimitError extends Error {
  constructor() {
    super("You're searching too fast. Wait a moment and try again.");
  }
}

export async function fetchOmniSearch(
  query: string,
  limit: number,
  signal?: AbortSignal,
  { group, page }: { group?: string; page?: number } = {},
): Promise<OmniGroup[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  if (group) params.set("group", group);
  if (page) params.set("page", String(page));
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    `/v2/search?${params}`,
  );
  const response = await fetch(url, {
    credentials: "include",
    headers,
    signal,
  });
  if (response.status === 429) throw new SearchRateLimitError();
  if (!response.ok) throw new Error(`Search failed (${response.status})`);
  // User ids past 2^53 would lose digits as JS numbers.
  const data = parseJsonWithLargeIds(await response.text()) as {
    groups?: OmniGroup[];
  };
  return Array.isArray(data?.groups) ? data.groups : [];
}
