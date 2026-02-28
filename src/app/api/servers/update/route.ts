import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";
import {
  SERVER_LINK_ERROR_MESSAGE,
  validatePrivateServerLink,
  validateServerRulesText,
} from "@/utils/serverValidation";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  if (!token)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  const body = await request.json();
  const link = typeof body?.link === "string" ? body.link : "";
  const rules = typeof body?.rules === "string" ? body.rules : "";

  const linkValidation = validatePrivateServerLink(link);
  if (!linkValidation.isValid) {
    return NextResponse.json(
      { message: linkValidation.message || SERVER_LINK_ERROR_MESSAGE },
      { status: 403 },
    );
  }

  const rulesValidation = validateServerRulesText(rules);
  if (!rulesValidation.isValid) {
    return NextResponse.json(
      { message: rulesValidation.message || "Invalid server rules" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${BASE_API_URL}/servers/update?id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, owner: token }),
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
      console.error("Server update failed:", loggedText);
    }
    return NextResponse.json(
      { message: "Failed to update server" },
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
