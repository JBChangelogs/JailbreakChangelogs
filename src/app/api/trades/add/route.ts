import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const body = await request.json();

  const upstream = await fetch(`${BASE_API_URL}/trades/v2/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await upstream.text();
  const parseUpstreamError = (raw: string): string | null => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as {
        message?: string;
        error?: string;
        detail?: string;
      };
      return parsed.message || parsed.detail || parsed.error || null;
    } catch {
      return null;
    }
  };

  if (!upstream.ok) {
    // Don't log 404 or 403 as errors
    if (upstream.status !== 404 && upstream.status !== 403) {
      const isHtml =
        text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html");
      const loggedText = isHtml
        ? `HTML Error Page (Status ${upstream.status})`
        : text.slice(0, 100);
      console.error("Trade add failed:", loggedText);
    }
    const upstreamMessage = parseUpstreamError(text);
    return NextResponse.json(
      {
        message: upstreamMessage || "Failed to add trade",
      },
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
