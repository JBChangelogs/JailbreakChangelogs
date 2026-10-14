import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { THEMES_CACHE_TAG } from "@/utils/api/themes";

/** The API calls this after each dashboard theme write. */
export async function POST(request: Request) {
  const secret = process.env.THEMES_REVALIDATE_SECRET;
  const given = Buffer.from(request.headers.get("x-revalidate-secret") ?? "");
  if (
    !secret ||
    given.length !== Buffer.byteLength(secret) ||
    !timingSafeEqual(given, Buffer.from(secret))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  revalidateTag(THEMES_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true });
}
