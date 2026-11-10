import { NextResponse, type NextRequest } from "next/server";
import { getDevToken } from "@/utils/api/apiDevToken";
import { getHumanVerificationHeaders } from "@/utils/api/verificationHeaders";

interface UserFlag {
  flag?: string | null;
  enabled?: boolean;
}

interface ProxyUser {
  flags?: UserFlag[];
}

const legacyItemTypeSegments = new Set([
  "vehicle",
  "vehicles",
  "spoiler",
  "spoilers",
  "rim",
  "rims",
  "texture",
  "textures",
  "hyperchrome",
  "hyperchromes",
  "tire style",
  "tire styles",
  "tire sticker",
  "tire stickers",
  "horn",
  "horns",
  "body color",
  "body colors",
  "drift",
  "drifts",
  "weapon skin",
  "weapon skins",
  "furniture",
  "furnitures",
]);

function getApiBaseUrl(): string | null {
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  const usePublicApi =
    isBuildPhase || process.env.RAILWAY_ENVIRONMENT_NAME !== "production";
  const baseUrl = usePublicApi
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.RAILWAY_INTERNAL_API_URL;

  return baseUrl || null;
}

function normalizeLegacyTypeSegment(segment: string) {
  return decodeURIComponent(segment)
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function isNumericId(segment: string) {
  return /^[0-9]+$/.test(segment);
}

function toCanonicalItemPath(itemType: string, itemName: string) {
  return `/item/${encodeURIComponent(itemType)}/${encodeURIComponent(itemName)}`;
}

function getSessionToken(request: NextRequest): string | undefined {
  const token = request.cookies.get("jbcl_token")?.value;
  if (token && token !== "undefined") return token;
  const { isDevEnv, injectedToken } = getDevToken();
  return isDevEnv ? injectedToken : undefined;
}

function isOwner(user: ProxyUser | null): boolean {
  if (!user || !Array.isArray(user.flags)) return false;
  return user.flags.some(
    (flag) => flag.flag === "is_owner" && flag.enabled === true,
  );
}

async function fetchCurrentUser(
  token: string,
  request: NextRequest,
): Promise<ProxyUser | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  try {
    const response = await fetch(`${apiBaseUrl}/v2/users/me`, {
      cache: "no-store",
      headers: {
        Authorization: token,
        "User-Agent": "JailbreakChangelogs-Auth/1.0",
        ...getHumanVerificationHeaders(request.cookies),
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as ProxyUser;
  } catch {
    return null;
  }
}

async function getLegacyItemRedirectResponse(
  request: NextRequest,
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();

  if (method !== "GET" && method !== "HEAD") return null;
  if (pathname.startsWith("/item/")) return null;
  if (pathname.startsWith("/api/")) return null;
  if (pathname.startsWith("/_next/")) return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 2) return null;

  const [typeSegmentRaw, idSegment] = segments;
  if (!isNumericId(idSegment)) return null;

  const normalizedTypeSegment = normalizeLegacyTypeSegment(typeSegmentRaw);
  if (!legacyItemTypeSegments.has(normalizedTypeSegment)) return null;

  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  try {
    const upstream = await fetch(
      `${apiBaseUrl}/v2/items/${encodeURIComponent(idSegment)}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "JailbreakChangelogs-Proxy/1.0",
          Accept: "application/json",
          ...getHumanVerificationHeaders(request.cookies),
        },
      },
    );

    if (!upstream.ok) return null;

    const data: unknown = await upstream.json();
    const asRecord = data as Record<string, unknown>;

    const embeddedData =
      asRecord.data && typeof asRecord.data === "object"
        ? (asRecord.data as Record<string, unknown>)
        : null;

    const embeddedName =
      embeddedData && typeof embeddedData.name === "string"
        ? embeddedData.name
        : null;
    const embeddedType =
      embeddedData && typeof embeddedData.type === "string"
        ? embeddedData.type
        : null;

    const directName = typeof asRecord.name === "string" ? asRecord.name : null;
    const directType = typeof asRecord.type === "string" ? asRecord.type : null;

    const redirectUrl = request.nextUrl.clone();

    if (embeddedName && embeddedType) {
      redirectUrl.pathname = toCanonicalItemPath(embeddedType, embeddedName);
      return NextResponse.redirect(redirectUrl, 308);
    }

    if (directName && directType) {
      redirectUrl.pathname = toCanonicalItemPath(directType, directName);
      return NextResponse.redirect(redirectUrl, 308);
    }

    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/experiments" || pathname.startsWith("/experiments/")) {
    const token = getSessionToken(request);
    const user = token ? await fetchCurrentUser(token, request) : null;
    if (!isOwner(user)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const legacyRedirect = await getLegacyItemRedirectResponse(request);
  if (legacyRedirect) return legacyRedirect;

  return clearStaleBrowserCache(request, NextResponse.next());
}

// Pages used to ship with a one-year stale-while-revalidate header, so browsers
// still hold copies of old deploys that crash against current chunks and API
// data. Wipe each browser's HTTP cache once; cookies and storage are untouched.
// ponytail: bump the cookie value to force another one-time wipe.
const CACHE_RESET_COOKIE = "jbcl_cache_reset";
const CACHE_RESET_VERSION = "1";

function clearStaleBrowserCache(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(CACHE_RESET_COOKIE)?.value === CACHE_RESET_VERSION)
    return response;
  response.headers.set("Clear-Site-Data", '"cache"');
  response.cookies.set(CACHE_RESET_COOKIE, CACHE_RESET_VERSION, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: true,
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
