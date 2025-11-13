import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api/api";

export async function POST(request: Request) {
  const { following } = (await request.json()) as { following?: string };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !following) {
    return NextResponse.json(
      { message: "Unauthorized or missing following" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BASE_API_URL}/users/followers/remove`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ follower: token, following }),
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    console.error("Follow remove failed:", text);
    return NextResponse.json(
      { message: "Failed to unfollow user" },
      { status: upstream.status },
    );
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
