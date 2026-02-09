import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { comment_id, reason } = (await request.json()) as {
    comment_id?: number;
    reason?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  if (!token || !comment_id || !reason) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/comments/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner: token, comment_id, reason }),
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
      console.error("Comment report failed:", loggedText);
    }
    return NextResponse.json(
      { message: "Failed to report comment" },
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
