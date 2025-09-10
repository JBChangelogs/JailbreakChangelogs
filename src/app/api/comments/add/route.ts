import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { content, item_id, item_type } = (await request.json()) as {
    content?: string;
    item_id?: number;
    item_type?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !content || !item_id || !item_type) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/comments/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content, item_id, item_type, owner: token }),
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
