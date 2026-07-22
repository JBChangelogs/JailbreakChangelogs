import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

interface BypassSuccessResponse {
  status: "success";
  result: string;
}

interface BypassErrorResponse {
  status: "error";
  message: string;
}

type BypassResponse = BypassSuccessResponse | BypassErrorResponse;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  if (!token || token === "undefined") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { message: "Missing url parameter" },
      { status: 400 },
    );
  }

  const apiKey = process.env.BYPASS_VIP_API_KEY;
  if (!apiKey) {
    log.error("BYPASS_VIP_API_KEY is not configured");
    return NextResponse.json(
      { message: "Bypass service is not configured" },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(
      `https://api.bypass.vip/premium/bypass?url=${encodeURIComponent(url)}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      },
    );

    const data = (await upstream.json()) as BypassResponse;

    if (!upstream.ok || data.status === "error") {
      const message =
        data.status === "error" ? data.message : "Failed to bypass link";
      return NextResponse.json(
        { message },
        { status: upstream.ok ? 400 : upstream.status },
      );
    }

    return NextResponse.json({ result: data.result });
  } catch (error) {
    log.error("Bypass request failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { message: "Failed to reach bypass service" },
      { status: 502 },
    );
  }
}
