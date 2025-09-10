import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !id) {
    return NextResponse.json(
      { message: "Unauthorized or missing id" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${BASE_API_URL}/trades/delete?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`,
    {
      method: "DELETE",
      cache: "no-store",
    },
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
