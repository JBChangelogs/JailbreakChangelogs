import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect");

    if (!redirect) {
      return NextResponse.json(
        { message: "Missing redirect parameter" },
        { status: 400 },
      );
    }

    // Construct the Roblox OAuth URL with the token as owner
    const oauthUrl = `${BASE_API_URL}/oauth/roblox?redirect=${encodeURIComponent(redirect)}&owner=${encodeURIComponent(token)}`;

    // Redirect to the Roblox OAuth URL
    return NextResponse.redirect(oauthUrl);
  } catch (error) {
    console.error("Error in Roblox OAuth redirect BFF:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
