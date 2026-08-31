import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";
import { proxyPassthroughResponse } from "@/utils/api/routeProxy";

const log = createLogger("API");

export async function POST(request: Request) {
  const { dupe_user, item_id, proof } = (await request.json()) as {
    dupe_user?: string;
    item_id?: number;
    proof?: string;
  };
  const token = await getAuthToken();
  if (!token || !dupe_user || !item_id || !proof) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/dupes/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner: token, dupe_user, item_id, proof }),
    cache: "no-store",
  });

  return proxyPassthroughResponse(upstream, {
    log,
    logLabel: "Dupe report failed",
    errorMessage: "Failed to report dupe",
  });
}
