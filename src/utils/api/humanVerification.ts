import { INVENTORY_API_URL, PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest, getDevToken } from "@/utils/api/apiDevToken";
import { observeSiteBanResponse } from "@/utils/api/siteBanInterceptor";

const BAN_REFERENCE_HEADER = "Ban-Reference";
const CHALLENGE_REQUIRED = "challenge_required";

export interface BanReferenceDetails {
  reference: string;
  reason: string | null;
  message: string;
  path: string | null;
  created_at: number | null;
}

type BanReferenceListener = (banRef: string | null, message?: string) => void;

let banReferenceListener: BanReferenceListener | null = null;
let isInterceptorInstalled = false;

export function subscribeBanReference(listener: BanReferenceListener) {
  banReferenceListener = listener;

  return () => {
    if (banReferenceListener === listener) {
      banReferenceListener = null;
    }
  };
}

function notifyBanReference(banRef: string | null, message?: string) {
  banReferenceListener?.(banRef, message);
}

function isApiUrl(apiUrl: string | undefined, url: string | URL): boolean {
  if (!apiUrl || !url) return false;

  try {
    const apiOrigin = new URL(apiUrl, window.location.href).origin;
    return new URL(url, window.location.href).origin === apiOrigin;
  } catch {
    return false;
  }
}

const isPublicApiUrl = (url: string | URL) => isApiUrl(PUBLIC_API_URL, url);
const isInventoryApiUrl = (url: string | URL) =>
  isApiUrl(INVENTORY_API_URL, url);

function fetchInventoryApi(
  originalFetch: typeof window.fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  let withCookies =
    input instanceof Request
      ? init
      : { credentials: "include" as const, ...init };
  const { isDevEnv, injectedToken } = getDevToken();
  if (isDevEnv && injectedToken) {
    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (!headers.has("Authorization")) {
      headers.set("Authorization", injectedToken);
      withCookies = { ...withCookies, headers };
    }
  }
  return originalFetch
    .call(window, input, withCookies)
    .then(async (response) => {
      if (response.status !== 403) return response;
      const banRef = response.headers.get(BAN_REFERENCE_HEADER);
      const body = (await response
        .clone()
        .json()
        .catch(() => null)) as {
        detail?: { error?: unknown; message?: unknown };
      } | null;
      const message = body?.detail?.message;
      if (banRef || body?.detail?.error === CHALLENGE_REQUIRED)
        notifyBanReference(
          banRef,
          typeof message === "string" ? message : undefined,
        );
      return response;
    });
}

export function installBanReferenceInterceptor(): () => void {
  if (typeof window === "undefined" || isInterceptorInstalled) {
    return () => undefined;
  }

  const originalFetch = window.fetch;
  const interceptedFetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : input;
    if (isInventoryApiUrl(url))
      return fetchInventoryApi(originalFetch, input, init);
    if (!isPublicApiUrl(url)) {
      return originalFetch.call(window, input, init);
    }

    return originalFetch.call(window, input, init).then((response) => {
      if (isPublicApiUrl(response.url)) {
        observeSiteBanResponse(response);
        const banRef = response.headers.get(BAN_REFERENCE_HEADER);
        if (banRef) notifyBanReference(banRef);
      }

      return response;
    });
  }) as typeof window.fetch;

  window.fetch = interceptedFetch;
  isInterceptorInstalled = true;

  return () => {
    if (window.fetch === interceptedFetch) {
      window.fetch = originalFetch;
    }
    isInterceptorInstalled = false;
  };
}

export async function fetchBanReferenceDetails(
  ref: string,
): Promise<BanReferenceDetails | null> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    `/v2/ban-references/${encodeURIComponent(ref)}`,
  );
  const response = await fetch(url, { headers, credentials: "include" });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Unable to load verification details.");
  }

  return (await response.json()) as BanReferenceDetails;
}

export async function submitHumanVerification(token: string): Promise<void> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/v2/human-verification",
  );
  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json",
    },
    body: JSON.stringify({ token }),
    credentials: "include",
  });

  if (response.ok) return;

  let message = "Verification failed. Please try again.";
  try {
    const body = (await response.json()) as { message?: unknown };
    if (typeof body.message === "string" && body.message) {
      message = body.message;
    }
  } catch {}

  throw new Error(message);
}
