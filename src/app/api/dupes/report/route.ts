import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { dupe_user, item_id, proof } = (await request.json()) as {
    dupe_user?: string;
    item_id?: number;
    proof?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !dupe_user || !item_id || !proof) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/dupes/report`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ owner: token, dupe_user, item_id, proof }),
    cache: "no-store",
  });

  const text = await upstream.text();

  if (!upstream.ok) {
    console.error("Dupe report failed:", text);
    return NextResponse.json(
      { message: "Failed to report dupe" },
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
