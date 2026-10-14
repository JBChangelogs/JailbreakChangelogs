import { unstable_cache } from "next/cache";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import {
  FALLBACK_THEMES,
  sanitizeThemes,
  type SiteTheme,
} from "@/utils/ui/themeOptions";

const log = createLogger("Themes");

/** /api/revalidate-themes clears this when the dashboard saves a theme. */
export const THEMES_CACHE_TAG = "themes";

// Throwing keeps a failed fetch out of the cache, so the last good themes
// keep serving until the API recovers.
const fetchThemes = unstable_cache(
  async (): Promise<SiteTheme[]> => {
    const response = await fetch(`${BASE_API_URL}/v2/themes`, {
      headers: { "User-Agent": "JailbreakChangelogs-Themes/1.0" },
      cache: "no-store",
      // Every page waits on this when nothing is cached, so a hung API
      // falls back to the built-in theme instead of stalling renders.
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`GET /v2/themes: ${response.status}`);
    const themes = sanitizeThemes(await response.json());
    if (themes.length === 0) throw new Error("GET /v2/themes: no themes");
    return themes;
  },
  [THEMES_CACHE_TAG],
  { revalidate: 300, tags: [THEMES_CACHE_TAG] },
);

/** The enabled themes in picker order, plus the one for new visitors. */
export async function getThemes(): Promise<{
  themes: SiteTheme[];
  defaultTheme: string;
}> {
  let themes = FALLBACK_THEMES;
  try {
    themes = await fetchThemes();
  } catch (err) {
    log.error("Error fetching themes, using the built-in fallback", err);
  }
  return {
    themes,
    defaultTheme: (themes.find((t) => t.is_default) ?? themes[0]).slug,
  };
}
