import { NextResponse, type NextRequest } from "next/server";

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

function isRoleRestricted(): boolean {
  return process.env.RAILWAY_ENVIRONMENT_NAME === "testing";
}

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
  return `/item/${encodeURIComponent(itemType.toLowerCase())}/${encodeURIComponent(itemName)}`;
}

function isAllowedWithoutTesterRole(request: NextRequest): boolean {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/access-denied") return true;
  if (pathname === "/api/session") return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname.startsWith("/api/oauth/")) return true;
  if (/\.[^/]+$/.test(pathname)) return true;

  // Allow auth callback URLs to pass through before session cookie exists.
  if (searchParams.has("token")) return true;

  return false;
}

function hasTestingAccess(user: ProxyUser | null): boolean {
  if (!user || !Array.isArray(user.flags)) return false;
  return user.flags.some(
    (flag) =>
      (flag.flag === "is_tester" || flag.flag === "is_owner") &&
      flag.enabled === true,
  );
}

async function fetchCurrentUser(token: string): Promise<ProxyUser | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  try {
    const response = await fetch(
      `${apiBaseUrl}/users/get/token?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "JailbreakChangelogs-Proxy/1.0",
        },
      },
    );

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
      `${apiBaseUrl}/items/get?id=${encodeURIComponent(idSegment)}`,
      {
        cache: "no-store",
        headers: {
          "User-Agent": "JailbreakChangelogs-Proxy/1.0",
          Accept: "application/json",
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
  const isTestingRestricted = isRoleRestricted();
  const isAccessDeniedPath = request.nextUrl.pathname === "/access-denied";

  if (isAccessDeniedPath && !isTestingRestricted) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isTestingRestricted && isAccessDeniedPath) {
    const token = request.cookies.get("jbcl_token")?.value;
    if (token && token !== "undefined") {
      const user = await fetchCurrentUser(token);
      if (hasTestingAccess(user)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    return NextResponse.next();
  }

  if (isTestingRestricted && !isAllowedWithoutTesterRole(request)) {
    const token = request.cookies.get("jbcl_token")?.value;
    if (!token || token === "undefined") {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    const user = await fetchCurrentUser(token);
    if (!hasTestingAccess(user)) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/access-denied", request.url));
    }
  }

  const legacyRedirect = await getLegacyItemRedirectResponse(request);
  if (legacyRedirect) return legacyRedirect;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
