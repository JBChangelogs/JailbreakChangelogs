import { NextResponse, type NextRequest } from "next/server";

interface UserFlag {
  flag?: string | null;
  enabled?: boolean;
}

interface ProxyUser {
  flags?: UserFlag[];
}

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

  if (!isTestingRestricted || isAllowedWithoutTesterRole(request)) {
    return NextResponse.next();
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
