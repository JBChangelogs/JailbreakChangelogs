import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PUBLIC_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const redirectUrl = "https://jailbreakchangelogs.xyz/settings";

  const targetUrl = `${PUBLIC_API_URL}/email/link?redirect=${encodeURIComponent(
    redirectUrl,
  )}&owner=${token}`;

  return NextResponse.redirect(targetUrl);
}
