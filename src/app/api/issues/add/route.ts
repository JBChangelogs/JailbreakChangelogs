import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { title, description } = (await request.json()) as {
    title?: string;
    description?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !title || !description) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/issues/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, description, user: token }),
    cache: "no-store",
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type":
        upstream.headers.get("content-type") || "application/json",
    },
  });
}
