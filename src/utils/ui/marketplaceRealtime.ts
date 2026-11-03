import {
  sanitizeCustomTheme,
  type MarketplaceTheme,
  type MarketplaceThemesPage,
  type MarketplaceSort,
} from "@/utils/api/userThemes";
import { SHARE_CODE } from "@/utils/ui/customTheme";

export type MarketplaceEvent =
  | {
      action: "marketplace_theme_published" | "marketplace_theme_updated";
      data: MarketplaceTheme;
    }
  | { action: "marketplace_theme_removed"; data: { share_code: string } };

export function parseMarketplaceEvent(value: unknown): MarketplaceEvent | null {
  if (!value || typeof value !== "object") return null;
  const { action, data } = value as { action?: unknown; data?: unknown };
  if (!data || typeof data !== "object") return null;
  const theme = data as MarketplaceTheme;
  if (
    typeof theme.share_code !== "string" ||
    !SHARE_CODE.test(theme.share_code)
  )
    return null;
  if (action === "marketplace_theme_removed")
    return { action, data: { share_code: theme.share_code } };
  if (
    action !== "marketplace_theme_published" &&
    action !== "marketplace_theme_updated"
  )
    return null;
  if (
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
  return { action, data: sanitizeCustomTheme(theme) };
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
