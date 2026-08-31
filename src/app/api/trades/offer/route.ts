import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";
import { proxyPassthroughResponse } from "@/utils/api/routeProxy";

const log = createLogger("API");

export async function POST(request: Request) {
  const { id } = (await request.json()) as { id?: number };
  const token = await getAuthToken();
  if (!token || !id) {
    return NextResponse.json(
      { message: "Unauthorized or missing id" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BASE_API_URL}/trades/offer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, owner: token }),
    cache: "no-store",
  });

  return proxyPassthroughResponse(upstream, {
    log,
    logLabel: "Trade offer failed",
    errorMessage: "Failed to make trade offer",
  });
}
