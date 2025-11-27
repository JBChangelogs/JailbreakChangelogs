import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

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
      `${BASE_API_URL}/users/following/get?user=${userId}`,
      {
        headers: {
          "User-Agent": "JailbreakChangelogs-Following/1.0",
        },
        cache: "no-store",
      },
    );

    if (upstream.status === 404) {
      return NextResponse.json([], { status: 200 });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { message: "Failed to fetch following" },
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
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { message: "Failed to fetch following" },
      { status: 500 },
    );
  }
}
