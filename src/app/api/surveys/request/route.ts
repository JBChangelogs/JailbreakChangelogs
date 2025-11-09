import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ survey: null }, { status: 200 });
  }

  const upstream = await fetch(
    `${BASE_API_URL}/surveys/request?user=${encodeURIComponent(token)}`,
    {
      cache: "no-store",
    },
  );

  const text = await upstream.text();

  if (!upstream.ok) {
    // Don't log 204, 404 or 403 as errors
    if (
      upstream.status !== 204 &&
      upstream.status !== 404 &&
      upstream.status !== 403
    ) {
      console.error("Survey request failed:", text);
    }
    return NextResponse.json({ survey: null }, { status: 200 });
  }

  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
