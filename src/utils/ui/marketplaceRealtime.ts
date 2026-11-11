import {
  sanitizeCustomTheme,
  type MarketplaceTheme,
  type MarketplaceThemesPage,
  type MarketplaceSort,
  type ThemeCompetition,
  type CustomTheme,
} from "@/utils/api/userThemes";
import { SHARE_CODE } from "@/utils/ui/customTheme";

export type MarketplaceEvent =
  | {
      action: "marketplace_theme_published" | "marketplace_theme_updated";
      data: MarketplaceTheme;
    }
  | { action: "marketplace_theme_removed"; data: { share_code: string } };

function parseMarketplaceTheme(value: unknown): MarketplaceTheme | null {
  if (!value || typeof value !== "object") return null;
  const theme = value as MarketplaceTheme;
  if (
    typeof theme.share_code !== "string" ||
    !SHARE_CODE.test(theme.share_code) ||
    typeof theme.label !== "string" ||
    (theme.description != null && typeof theme.description !== "string") ||
    (theme.scheme !== "dark" && theme.scheme !== "light") ||
    !theme.vars ||
    typeof theme.vars !== "object" ||
    Array.isArray(theme.vars) ||
    typeof theme.published_at !== "number"
  )
    return null;
  const user = theme.user;
  if (
    user !== null &&
    (!user ||
      typeof user !== "object" ||
      typeof user.id !== "string" ||
      typeof user.username !== "string" ||
      (user.global_name != null && typeof user.global_name !== "string"))
  )
    return null;
  return sanitizeCustomTheme(theme);
}

export function parseMarketplaceEvent(value: unknown): MarketplaceEvent | null {
  if (!value || typeof value !== "object") return null;
  const { action, data } = value as { action?: unknown; data?: unknown };
  if (!data || typeof data !== "object") return null;
  const shareCode = (data as { share_code?: unknown }).share_code;
  if (typeof shareCode !== "string" || !SHARE_CODE.test(shareCode)) return null;
  if (action === "marketplace_theme_removed")
    return { action, data: { share_code: shareCode } };
  if (
    action !== "marketplace_theme_published" &&
    action !== "marketplace_theme_updated"
  )
    return null;
  const theme = parseMarketplaceTheme(data);
  return theme && { action, data: theme };
}

export type CompetitionEvent =
  | {
      action: "competition_entry_added";
      competitionId: number;
      entry: { theme: MarketplaceTheme; entered_at: number };
    }
  | {
      action: "competition_entry_removed";
      competitionId: number;
      shareCode: string;
    }
  | { action: "competition_finalized"; competition: ThemeCompetition }
  /** A theme entered in these competitions was published, edited or unlisted. */
  | {
      action: "competition_theme_changed";
      competitionIds: number[];
      event: MarketplaceEvent;
    };

export function parseCompetitionEvent(value: unknown): CompetitionEvent | null {
  if (!value || typeof value !== "object") return null;
  const { action, data } = value as {
    action?: unknown;
    data?: Record<string, unknown>;
  };
  if (!data || typeof data !== "object") return null;
  const competitionId = data.competition_id;
  if (action === "competition_entry_added") {
    const theme = parseMarketplaceTheme(data.theme);
    if (
      !theme ||
      typeof competitionId !== "number" ||
      typeof data.entered_at !== "number"
    )
      return null;
    return {
      action,
      competitionId,
      entry: { theme, entered_at: data.entered_at },
    };
  }
  if (action === "competition_entry_removed") {
    if (
      typeof competitionId !== "number" ||
      typeof data.share_code !== "string" ||
      !SHARE_CODE.test(data.share_code)
    )
      return null;
    return { action, competitionId, shareCode: data.share_code };
  }
  if (action === "competition_finalized") {
    const competition = data.competition as ThemeCompetition | undefined;
    if (!competition || typeof competition.id !== "number") return null;
    const winner = competition.winner
      ? parseMarketplaceTheme(competition.winner.theme)
      : null;
    return {
      action,
      competition: {
        ...competition,
        winner:
          competition.winner && winner
            ? { ...competition.winner, theme: winner }
            : null,
      },
    };
  }
  const event = parseMarketplaceEvent(value);
  const ids = Array.isArray(data.competitions)
    ? data.competitions.filter((id): id is number => typeof id === "number")
    : [];
  return event && ids.length
    ? { action: "competition_theme_changed", competitionIds: ids, event }
    : null;
}

export function marketplaceMatchesSearch(
  theme: MarketplaceTheme,
  query: string,
) {
  const search = query.trim().toLowerCase();
  if (search.startsWith("id:"))
    return theme.share_code.toLowerCase() === search.slice(3).trim();
  return [
    theme.label,
    theme.description,
    theme.user?.username,
    theme.user?.global_name,
  ].some((name) => name?.toLowerCase().includes(search.slice(0, 64)));
}

export function applyMarketplaceEvent(
  previous: MarketplaceThemesPage | undefined,
  event: MarketplaceEvent,
  query: string,
  sort: MarketplaceSort,
): MarketplaceThemesPage | undefined {
  if (!previous) return previous;
  const index = previous.items.findIndex(
    (theme) => theme.share_code === event.data.share_code,
  );
  let items = previous.items;
  let total = previous.total;
  if (
    event.action === "marketplace_theme_removed" ||
    !marketplaceMatchesSearch(event.data, query)
  ) {
    if (index < 0) return previous;
    items = items.filter((theme) => theme.share_code !== event.data.share_code);
    total = Math.max(0, total - 1);
  } else if (index >= 0) {
    items = items.map((theme, position) =>
      position === index ? event.data : theme,
    );
  } else if (
    event.action === "marketplace_theme_published" &&
    sort === "newest" &&
    previous.page === 1
  ) {
    items = [event.data, ...items].slice(0, previous.size);
    total++;
  } else {
    return previous;
  }
  return {
    ...previous,
    items,
    total,
    total_pages: Math.ceil(total / previous.size),
  };
}

// Pages locally: a user has at most their theme limit (25).
export function ownMarketplacePage(
  themes: CustomTheme[],
  user: MarketplaceTheme["user"],
  query: string,
  sort: MarketplaceSort,
  page: number,
  size = 24,
): MarketplaceThemesPage {
  const items = themes
    .filter((theme) => theme.published_at != null)
    .map((theme) => ({ ...theme, user }))
    .filter((theme) => marketplaceMatchesSearch(theme, query))
    .sort((a, b) =>
      sort === "newest"
        ? b.published_at! - a.published_at!
        : a.published_at! - b.published_at!,
    );
  const totalPages = Math.ceil(items.length / size);
  const current = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
  return {
    items: items.slice((current - 1) * size, current * size),
    total: items.length,
    page: current,
    total_pages: totalPages,
    size,
  };
}
