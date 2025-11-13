import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api/api";

export async function POST(request: Request) {
  const { id, item_type } = (await request.json()) as {
    id?: number;
    item_type?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !id || !item_type) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/comments/delete`, {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, item_type, owner: token }),
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    console.error("Comment delete failed:", text);
    return NextResponse.json(
      { message: "Failed to delete comment" },
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
