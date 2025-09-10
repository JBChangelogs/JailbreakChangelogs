import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

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

  const upstream = await fetch(`${BASE_API_URL}/users/followers/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ follower: token, following }),
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
