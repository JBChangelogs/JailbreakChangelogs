import { EMBED_ORIGIN, embedImageUrl, pregenerateUrl } from "@/lib/embedImage";

// A cold OG image takes embedgen 2-6s to render. Its /pregenerate endpoint
// queues the render in the background so Discord's first fetch is instant.
const warmed = new Set<string>();

/** Queues an og:image URL for background rendering, once per tab. */
export function warmEmbedImageUrl(url: string | null | undefined) {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  if (
    !url?.startsWith(`${EMBED_ORIGIN}/og/`) &&
    !url?.startsWith(`${EMBED_ORIGIN}/og.png`)
  )
    return;
  if (warmed.has(url) || nav.webdriver || nav.connection?.saveData) return;
  warmed.add(url);
  // Embedgen allows CORS, so the status is readable: a full queue (503) or a
  // network failure frees the URL so a later share can retry it.
  fetch(pregenerateUrl(url), { keepalive: true }).then(
    (response) => {
      if (!response.ok) warmed.delete(url);
    },
    () => warmed.delete(url),
  );
}

/** Warms the image for a site path being shared or just created. */
export const warmEmbed = (path: string) =>
  warmEmbedImageUrl(embedImageUrl(path));
