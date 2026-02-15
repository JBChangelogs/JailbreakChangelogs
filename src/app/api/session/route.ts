import { getCurrentUser } from "@/utils/serverSession";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getCurrentUser();
  const headers = {
    "content-type": "application/json",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  };

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200, headers });
  }
  return NextResponse.json({ user }, { status: 200, headers });
}
