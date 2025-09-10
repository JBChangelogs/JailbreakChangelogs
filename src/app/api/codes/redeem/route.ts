import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !code) {
    return NextResponse.json(
      { message: "Unauthorized or missing code" },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${BASE_API_URL}/codes/redeem`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, owner: token }),
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
