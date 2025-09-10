import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { description } = (await request.json()) as { description?: string };
    if (typeof description !== "string") {
      return NextResponse.json(
        { message: "Invalid description" },
        { status: 400 },
      );
    }

    const resp = await fetch(`${BASE_API_URL}/users/description/update`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user: token, description }),
      cache: "no-store",
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json(
        { message: err || "Failed to update bio" },
        { status: resp.status },
      );
    }

    const body = await resp.text();
    let json: unknown;
    try {
      json = body ? JSON.parse(body) : { ok: true };
    } catch {
      json = { ok: true };
    }
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
