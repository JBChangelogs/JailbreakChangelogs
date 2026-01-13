import { NextResponse } from "next/server";
import { getWebsiteVersion } from "@/utils/version";

export const revalidate = 3600;

export async function GET() {
  try {
    const versionInfo = await getWebsiteVersion();
    return NextResponse.json(versionInfo, {
      status: 200,
    });
  } catch (error) {
    console.error("Error in /api/version:", error);
    return NextResponse.json(
      {
        version: "unknown",
        date: "unknown",
        branch: "unknown",
        commitUrl: "unknown",
      },
      { status: 200 },
    );
  }
}
