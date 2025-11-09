import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id, answer } = (await request.json()) as {
      id?: string;
      answer?: string;
    };
    if (!id || !answer) {
      return NextResponse.json(
        { message: "Missing id or answer" },
        { status: 400 },
      );
    }

    const resp = await fetch(`${BASE_API_URL}/surveys/submit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, answer, owner: token }),
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
      // Don't log 204, 404 or 403 as errors
      if (resp.status !== 204 && resp.status !== 404 && resp.status !== 403) {
        console.error("Survey submit failed:", text);
      }
      return NextResponse.json(json ?? { message: "Error submitting survey" }, {
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
