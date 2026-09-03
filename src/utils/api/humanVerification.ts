import { PUBLIC_API_URL } from "@/utils/api/api";
import { buildApiFetchRequest } from "@/utils/api/apiDevToken";

export const BAN_REFERENCE_HEADER = "Ban-Reference";

export interface BanReferenceDetails {
  reference: string;
  reason: string | null;
  message: string;
  path: string | null;
  created_at: number | null;
}

type BanReferenceListener = (banRef: string) => void;

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

function notifyBanReference(banRef: string) {
  banReferenceListener?.(banRef);
}

function isPublicApiResponse(response: Response): boolean {
  if (!PUBLIC_API_URL || !response.url) return false;

  try {
    const apiOrigin = new URL(PUBLIC_API_URL, window.location.href).origin;
    return new URL(response.url, window.location.href).origin === apiOrigin;
  } catch {
    return false;
  }
}

export function installBanReferenceInterceptor(): () => void {
  if (typeof window === "undefined" || isInterceptorInstalled) {
    return () => undefined;
  }

  const originalFetch = window.fetch;
  const interceptedFetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const response = await originalFetch.call(window, input, init);

    if (isPublicApiResponse(response)) {
      const banRef = response.headers.get(BAN_REFERENCE_HEADER);
      if (banRef) notifyBanReference(banRef);
    }

    return response;
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
    `/ban-reference/${encodeURIComponent(ref)}`,
  );
  const response = await fetch(url, { headers });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error("Unable to load verification details.");
  }

  return (await response.json()) as BanReferenceDetails;
}

export async function submitHumanVerification(token: string): Promise<void> {
  const { url, headers } = buildApiFetchRequest(
    PUBLIC_API_URL,
    "/verify-human",
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
