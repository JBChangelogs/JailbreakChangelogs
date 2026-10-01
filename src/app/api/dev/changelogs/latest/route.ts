import { NextResponse } from "next/server";
import { getCachedLatestChangelogEntry } from "@/lib/changelog-parser";

export async function GET() {
  const latest = await getCachedLatestChangelogEntry();
  if (!latest?.content.trim()) {
    return NextResponse.json(
      { error: "No changelog available" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      slug: latest.slug,
      title: latest.title || `Release ${latest.version}`,
      version: latest.version,
      date: latest.date,
      content: latest.content,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
