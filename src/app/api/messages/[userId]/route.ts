import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;

    if (!token || token === "undefined") {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const response = await fetch(
      `${BASE_API_URL}/messages/${encodeURIComponent(userId)}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          "User-Agent": "JailbreakChangelogs-Messages/1.0",
        },
        cache: "no-store",
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return new NextResponse(
        responseText || '{"error":"failed_to_fetch_messages"}',
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Messages thread API route failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;

    if (!token || token === "undefined") {
      return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    }

    const body = (await request.json()) as { content?: string };
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "missing_content" }, { status: 400 });
    }

    const response = await fetch(
      `${BASE_API_URL}/messages/${encodeURIComponent(userId)}`,
      {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "User-Agent": "JailbreakChangelogs-Messages/1.0",
        },
        cache: "no-store",
        body: JSON.stringify({ content }),
      },
    );

    const responseText = await response.text();

    if (!response.ok) {
      return new NextResponse(
        responseText || '{"error":"failed_to_send_message"}',
        {
          status: response.status,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new NextResponse(responseText, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Messages send API route failed:", error);
    return NextResponse.json(
      { error: "internal_server_error" },
      { status: 500 },
    );
  }
}
