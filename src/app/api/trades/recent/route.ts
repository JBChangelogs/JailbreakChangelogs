import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const parsedLimit = Number(limitParam);
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), 50)
      : 12;

  const upstream = await fetch(
    `${BASE_API_URL}/trades/v2/recent?limit=${limit}`,
    {
      headers: {
        "User-Agent": "JailbreakChangelogs-Trading/2.0",
      },
      cache: "no-store",
    },
  );

  const text = await upstream.text();

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
