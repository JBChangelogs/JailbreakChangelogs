import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";
import { proxyPassthroughResponse } from "@/utils/api/routeProxy";

const log = createLogger("API");

export async function POST(request: Request) {
  const { following } = (await request.json()) as { following?: string };
  const token = await getAuthToken();
  if (!token || !following) {
    return NextResponse.json(
      { message: "Unauthorized or missing following" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${BASE_API_URL}/v2/users/me/following/${encodeURIComponent(following)}`,
    {
      method: "DELETE",
      headers: { Authorization: token },
      cache: "no-store",
    },
  );

  return proxyPassthroughResponse(upstream, {
    log,
    logLabel: "Follow remove failed",
    errorMessage: "Failed to unfollow user",
  });
}
