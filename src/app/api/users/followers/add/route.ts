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

  if (!upstream.ok) {
    // Don't log 404 or 403 as errors
    if (upstream.status !== 404 && upstream.status !== 403) {
      const isHtml =
        text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
      const loggedText = isHtml
        ? `HTML Error Page (Status ${upstream.status})`
        : text.slice(0, 100);
      console.error("Follow add failed:", loggedText);
    }
    return NextResponse.json(
      { message: "Failed to follow user" },
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
