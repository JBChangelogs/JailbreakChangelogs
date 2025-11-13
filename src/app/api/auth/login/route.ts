import { BASE_API_URL } from "@/utils/api/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token || token === "undefined") {
      return new Response(JSON.stringify({ message: "Missing token" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const resp = await fetch(
      `${BASE_API_URL}/users/get/token?token=${encodeURIComponent(token)}&nocache=true`,
      { cache: "no-store" },
    );
    if (!resp.ok) {
      return new Response(JSON.stringify({ message: "Invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    const user = await resp.json();

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json(user, { status: 200 });
    response.cookies.set("token", token, {
      httpOnly: false, // Allow client-side access for WebSocket connection
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch {
    return new Response(JSON.stringify({ message: "Login failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
