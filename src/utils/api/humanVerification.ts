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

export type CaptchaType = "turnstile" | "jbcl" | "both";

export function getCaptchaType(value: unknown): CaptchaType {
  return value === "jbcl" || value === "both" ? value : "turnstile";
}

export interface VerificationTokens {
  token?: string;
  jbcl_token?: string;
}

export class CaptchaVerificationError extends Error {
  constructor(
    message: string,
    public captchaType: CaptchaType,
  ) {
    super(message);
  }
}

type BanReferenceListener = (
  banRef: string | null,
  message?: string,
  captchaType?: CaptchaType,
) => void;

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

function notifyBanReference(
  banRef: string | null,
  message?: string,
  captchaType: CaptchaType = "turnstile",
) {
  banReferenceListener?.(banRef, message, captchaType);
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
        error?: unknown;
        message?: unknown;
        captcha_type?: unknown;
        detail?: { error?: unknown; message?: unknown; captcha_type?: unknown };
      } | null;
      const detail = body?.detail ?? body;
      const message = detail?.message;
      if (banRef || detail?.error === CHALLENGE_REQUIRED)
        notifyBanReference(
          banRef,
          typeof message === "string" ? message : undefined,
          getCaptchaType(detail?.captcha_type),
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
        if (banRef)
          notifyBanReference(
            banRef,
            undefined,
            getCaptchaType(response.headers.get("Captcha-Type")),
          );
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

export async function submitHumanVerification(
  tokens: VerificationTokens,
): Promise<void> {
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
    body: JSON.stringify(tokens),
    credentials: "include",
  });

  if (response.ok) return;

  let message = "Verification failed. Please try again.";
  let captchaType: CaptchaType | undefined;
  try {
    const body = (await response.json()) as {
      message?: unknown;
      error?: unknown;
      captcha_type?: unknown;
    };
    if (response.status === 400 && body.error === "captcha_failed") {
      captchaType = getCaptchaType(body.captcha_type);
    }
    if (typeof body.message === "string" && body.message) {
      message = body.message;
    }
  } catch {}

  if (captchaType) throw new CaptchaVerificationError(message, captchaType);
  throw new Error(message);
}
