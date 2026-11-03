import { buildApiFetchRequest } from "@/utils/api/apiDevToken";
import type { UserData } from "@/types/auth";
import { marketThemeVars } from "@/utils/ui/marketThemeVars";
import {
  safeValue,
  sanitizeThemes,
  type SiteTheme,
} from "@/utils/ui/themeOptions";

export interface ThemePreviewImage {
  id: string;
  url: string;
  kind: "desktop" | "mobile";
}

/** A custom color theme: colors, a logo filter and an optional icon. */
export interface CustomTheme {
  /** 8 characters; anyone can look the theme up with it. */
  share_code: string;
  label: string;
  scheme: "dark" | "light";
  vars: Record<string, string>;
  logo_filter: string | null;
  /** An Iconify name, or null for the default palette. Older themes lack it. */
  icon?: string | null;
  published_at?: number | null;
  previews?: ThemePreviewImage[];
}

/** One of the signed-in user's own themes. */
export interface UserTheme extends CustomTheme {
  id: number;
}

/** A theme looked up by its share code. */
export interface SharedTheme extends CustomTheme {
  /** Who made it. */
  user_id: string;
}

export type CustomThemeInput = Pick<
  CustomTheme,
  "label" | "scheme" | "vars" | "logo_filter" | "icon"
> & { published?: boolean };

export interface MarketplaceTheme extends CustomTheme {
  user:
    | (Pick<UserData, "id" | "username"> &
        Partial<
          Pick<
            UserData,
            | "global_name"
            | "avatar"
            | "custom_avatar"
            | "settings"
            | "premiumtype"
          >
        >)
    | null;
}

export interface MarketplaceThemesPage {
  items: MarketplaceTheme[];
  total: number;
  page: number;
  total_pages: number;
  size: number;
}

export type MarketplaceSort = "newest" | "oldest";

/** An error from the themes API, with its code such as "supporter_required". */
export class ThemeApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    /** Every reason a theme_unreadable theme was rejected. */
    readonly problems: string[] = [],
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  // Read per call (Next inlines it at build time), so tests can set it.
  baseUrl = process.env.NEXT_PUBLIC_API_URL,
): Promise<T> {
  const { url, headers } = buildApiFetchRequest(baseUrl, path);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
    },
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Validation errors come back as FastAPI's { detail: [{ msg }] }.
    const detail = Array.isArray(data?.detail)
      ? data.detail[0]?.msg
      : data?.detail;
    throw new ThemeApiError(
      response.status,
      data?.error,
      data?.message ?? detail ?? `Request failed (${response.status})`,
      Array.isArray(data?.problems) ? data.problems.map(String) : [],
    );
  }
  return data as T;
}

const VAR_KEY = /^--[a-z0-9-]+$/;
const ICON = /^[a-z0-9-]+:[a-z0-9-]+$/;

export function sanitizeThemePreviews(value: unknown): ThemePreviewImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((preview): preview is ThemePreviewImage => {
      if (
        !preview ||
        typeof preview.id !== "string" ||
        !preview.id ||
        typeof preview.url !== "string" ||
        (preview.kind !== "desktop" && preview.kind !== "mobile")
      )
        return false;
      try {
        const url = new URL(preview.url);
        return (
          url.protocol === "https:" &&
          url.hostname === "uploads.jailbreakchangelogs.com" &&
          url.pathname.startsWith("/theme-previews/") &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    })
    .slice(0, 3);
}

/**
 * Keeps only what's safe to apply: the same checks site themes get. Custom
 * themes come from other people (shared codes, synced preferences), and a
 * value like url(...) would load a remote resource on every page.
 */
export function sanitizeCustomTheme<T extends CustomTheme>(theme: T): T {
  return {
    ...theme,
    ...("previews" in theme
      ? { previews: sanitizeThemePreviews(theme.previews) }
      : {}),
    scheme: theme.scheme === "light" ? "light" : "dark",
    vars: Object.fromEntries(
      Object.entries(marketThemeVars(theme.vars ?? {})).filter(
        ([key, value]) => VAR_KEY.test(key) && safeValue(value),
      ),
    ),
    logo_filter: safeValue(theme.logo_filter) ? theme.logo_filter : null,
    icon:
      typeof theme.icon === "string" && ICON.test(theme.icon)
        ? theme.icon
        : null,
  };
}

export const listMyThemes = async () => {
  const data = await request<{ themes: UserTheme[]; limit: number }>(
    "/v2/users/me/themes",
  );
  return { ...data, themes: data.themes.map(sanitizeCustomTheme) };
};

export const createMyTheme = async (theme: CustomThemeInput) =>
  sanitizeCustomTheme(
    await request<UserTheme>("/v2/users/me/themes", {
      method: "POST",
      body: JSON.stringify({ ...theme, vars: marketThemeVars(theme.vars) }),
    }),
  );

/** `vars` replaces the whole map, so send every color. */
export const updateMyTheme = async (
  id: number,
  theme: Partial<CustomThemeInput>,
) =>
  sanitizeCustomTheme(
    await request<UserTheme>(`/v2/users/me/themes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(
        theme.vars ? { ...theme, vars: marketThemeVars(theme.vars) } : theme,
      ),
    }),
  );

/**
 * Why a save would be rejected as unreadable, without saving. No tier needed.
 * `fixes` suggests, per failing color, a replacement that fixes it alone.
 */
export const checkMyTheme = async (
  theme: Pick<CustomThemeInput, "scheme" | "vars">,
) => {
  const data = await request<{
    valid: boolean;
    problems: string[];
    fixes?: Record<string, string>;
  }>("/v2/users/me/themes/check", {
    method: "POST",
    body: JSON.stringify({ ...theme, vars: marketThemeVars(theme.vars) }),
  });
  // Applied straight into the theme, so held to the same checks.
  const fixes = Object.fromEntries(
    Object.entries(data.fixes ?? {}).filter(
      ([key, value]) => VAR_KEY.test(key) && safeValue(value),
    ),
  );
  return { ...data, fixes };
};

export const deleteMyTheme = (id: number) =>
  request<{ success: boolean }>(`/v2/users/me/themes/${id}`, {
    method: "DELETE",
  });

/** Public; works signed out. Pass the server's API URL when called on the server. */
export const fetchSharedTheme = async (code: string, baseUrl?: string) =>
  sanitizeCustomTheme(
    await request<SharedTheme>(
      `/v2/themes/shared/${encodeURIComponent(code)}`,
      {},
      baseUrl,
    ),
  );

/** The site's themes with their colors, for starting a custom theme from one. */
export const fetchSiteThemes = async () =>
  sanitizeThemes(await request<SiteTheme[]>("/v2/themes"));

export async function fetchMarketplaceThemes(
  page = 1,
  sort: MarketplaceSort = "newest",
  query = "",
) {
  const params = new URLSearchParams({ page: String(page), sort });
  const search = query.trim();
  if (search) params.set("query", search);
  const data = await request<MarketplaceThemesPage>(
    `/v2/themes/marketplace${search ? "/search" : ""}?${params}`,
  );
  return { ...data, items: data.items.map(sanitizeCustomTheme) };
}

export const reportMarketplaceTheme = (code: string, reason: string) =>
  request<{ success: boolean }>(
    `/v2/themes/marketplace/${encodeURIComponent(code)}/reports`,
    { method: "POST", body: JSON.stringify({ reason: reason.trim() }) },
  );

export async function uploadThemePreview(id: number, image: File) {
  const body = new FormData();
  body.append("image", image);
  const data = await request<{ previews: ThemePreviewImage[] }>(
    `/v2/users/me/themes/${id}/previews`,
    { method: "POST", body },
  );
  return sanitizeThemePreviews(data.previews);
}

export async function deleteThemePreview(id: number, previewId: string) {
  const data = await request<{ previews: ThemePreviewImage[] }>(
    `/v2/users/me/themes/${id}/previews/${encodeURIComponent(previewId)}`,
    { method: "DELETE" },
  );
  return sanitizeThemePreviews(data.previews);
}
