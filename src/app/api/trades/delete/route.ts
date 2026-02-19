import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function DELETE(request: Request) {
  if (!BASE_API_URL) {
    return NextResponse.json(
      { message: "Trade API is not configured" },
      { status: 500 },
    );
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing id" }, { status: 400 });
  }

  const shouldSendAuthHeader = process.env.NODE_ENV === "development";
  const headers: Record<string, string> = {};
  if (shouldSendAuthHeader) {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    headers.Authorization = token;
  }

  const upstream = await fetch(
    `${BASE_API_URL}/trades/v2/${encodeURIComponent(id)}/delete`,
    {
      method: "DELETE",
      headers,
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
