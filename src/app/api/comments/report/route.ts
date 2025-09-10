import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { comment_id, reason } = (await request.json()) as {
    comment_id?: number;
    reason?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
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
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
