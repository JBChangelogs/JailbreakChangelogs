import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";
import { getAuthToken } from "@/utils/api/routeAuth";
import { proxyPassthroughResponse } from "@/utils/api/routeProxy";

const log = createLogger("API");

export async function POST(request: Request) {
  const { title, description } = (await request.json()) as {
    title?: string;
    description?: string;
  };
  const token = await getAuthToken();
  if (!token || !title || !description) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/issues/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, description, user: token }),
    cache: "no-store",
  });

  return proxyPassthroughResponse(upstream, {
    log,
    logLabel: "Issue add failed",
    errorMessage: "Failed to submit issue",
  });
}
