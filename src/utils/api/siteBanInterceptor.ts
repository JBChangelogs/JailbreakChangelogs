import { parseBan, type BanInfo } from "@/utils/api/ban";

type SiteBanListener = (ban: BanInfo | null) => void;

let siteBanListener: SiteBanListener | null = null;
let siteBanResponsePath: string | null = null;

export function subscribeSiteBan(listener: SiteBanListener): () => void {
  siteBanListener = listener;

  return () => {
    if (siteBanListener === listener) {
      siteBanListener = null;
    }
  };
}

function getResponsePath(response: Response): string | null {
  try {
    return new URL(response.url, window.location.href).pathname;
  } catch {
    return null;
  }
}

/**
 * Observes a response that has already been confirmed to come from the public
 * API. A successful response only clears a site ban when the same endpoint has
 * previously enforced it, preventing unrelated API successes from dismissing
 * the full-screen ban state.
 */
export function observeSiteBanResponse(response: Response): void {
  const ban = parseBan(response);
  const responsePath = getResponsePath(response);

  if (ban?.banType === "website") {
    siteBanResponsePath = responsePath;
    siteBanListener?.(ban);
    return;
  }

  const isAuthoritativeClear =
    response.ok &&
    (responsePath === "/users/me" ||
      (siteBanResponsePath !== null && responsePath === siteBanResponsePath));

  if (isAuthoritativeClear) {
    siteBanResponsePath = null;
    siteBanListener?.(null);
  }
}
