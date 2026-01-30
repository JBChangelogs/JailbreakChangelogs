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

  if (!upstream.ok) {
    // Don't log 404 or 403 as errors
    if (upstream.status !== 404 && upstream.status !== 403) {
      const isHtml =
        text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
      const loggedText = isHtml
        ? `HTML Error Page (Status ${upstream.status})`
        : text.slice(0, 100);
      console.error("Trade delete failed:", loggedText);
    }
    return NextResponse.json(
      { message: "Failed to delete trade" },
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
