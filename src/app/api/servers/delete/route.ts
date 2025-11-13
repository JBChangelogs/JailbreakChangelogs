import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api/api";

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { link?: string };
    if (!body.link) {
      return NextResponse.json({ message: "Missing link" }, { status: 400 });
    }

    const resp = await fetch(`${BASE_API_URL}/servers/delete`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ link: body.link, owner: token }),
      cache: "no-store",
    });

    const text = await resp.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : { ok: resp.ok };
    } catch {
      json = { ok: resp.ok };
    }

    if (!resp.ok) {
      return NextResponse.json(json ?? { message: "Error deleting server" }, {
        status: resp.status,
      });
    }

    return NextResponse.json(json ?? { ok: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
