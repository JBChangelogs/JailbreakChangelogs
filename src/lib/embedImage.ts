// Kept apart from discord-embed.ts so client code can build these URLs
// without bundling the Discord embed builder.
const SITE_URL = "https://jailbreakchangelogs.com";

export const EMBED_ORIGIN = "https://embeds.jailbreakchangelogs.com";

/**
 * The OG image URL for a site path. Cloudflare caches the exact URL, so
 * og:image and every cache warm must build it here.
 */
export function embedImageUrl(path: string): string {
  const url = new URL(path, SITE_URL);
  const route = url.pathname.replace(/\/$/, "");
  const query = ["theme", "share"]
    .flatMap((key) => {
      const value = url.searchParams.get(key);
      return value ? [`${key}=${encodeURIComponent(value)}`] : [];
    })
    .join("&");
  return `${EMBED_ORIGIN}/og${route}.png${query ? `?${query}` : ""}`;
}

/** Embedgen's background-render endpoint for an og:image URL. */
export const pregenerateUrl = (imageUrl: string) =>
  imageUrl.replace(`${EMBED_ORIGIN}/og`, `${EMBED_ORIGIN}/pregenerate/og`);
