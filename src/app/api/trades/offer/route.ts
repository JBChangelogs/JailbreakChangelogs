import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api/api";

export async function POST(request: Request) {
  const { id } = (await request.json()) as { id?: number };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !id) {
    return NextResponse.json(
      { message: "Unauthorized or missing id" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BASE_API_URL}/trades/offer`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, owner: token }),
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    console.error("Trade offer failed:", text);
    return NextResponse.json(
      { message: "Failed to make trade offer" },
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
