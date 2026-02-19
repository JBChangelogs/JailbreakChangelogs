import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  if (!BASE_API_URL) {
    return NextResponse.json(
      { message: "Trade API is not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const shouldSendAuthHeader = process.env.NODE_ENV === "development";
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (shouldSendAuthHeader) {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    headers.Authorization = token;
  }

  const upstream = await fetch(`${BASE_API_URL}/trades/v2/create`, {
    method: "POST",
    headers,
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
    const upstreamContentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const trimmedText = text.trim();
    const isHtml =
      trimmedText.startsWith("<!DOCTYPE") || trimmedText.startsWith("<html");

    // Don't log 404 or 403 as errors
    if (upstreamContentType.includes("application/json")) {
      return new NextResponse(text, {
        status: upstream.status,
        headers: { "content-type": upstreamContentType },
      });
    }

    const upstreamMessage = parseUpstreamError(text);
    return NextResponse.json(
      {
        message:
          upstreamMessage ||
          (isHtml
            ? "Trade service returned an unexpected response."
            : "Failed to add trade"),
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
