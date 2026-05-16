import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api/api";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user");

  if (!userId) {
    return NextResponse.json(
      { message: "Missing user parameter" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      `${BASE_API_URL}/users/followers/get?user=${userId}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Followers/1.0",
        },
        cache: "no-store",
      },
    );

    if (upstream.status === 404) {
      return NextResponse.json([], { status: 200 });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Failed to fetch followers" },
        { status: upstream.status },
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    log.error("Error fetching followers:", error);
    return NextResponse.json(
      { message: "Failed to fetch followers" },
      { status: 500 },
    );
  }
}
