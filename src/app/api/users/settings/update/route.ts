import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api/api";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const requestBody = await request.json();
    const resp = await fetch(
      `${BASE_API_URL}/users/settings/update?user=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
        cache: "no-store",
      },
    );

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json(
        { message: err || "Failed to update settings" },
        { status: resp.status },
      );
    }
    const json = await resp.json();
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
