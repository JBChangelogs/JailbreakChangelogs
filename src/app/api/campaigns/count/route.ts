import { NextRequest, NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign } = body;
    let { token } = body;

    // If token is not provided in body, try to get it from cookies
    if (!token) {
      token = request.cookies.get("jbcl_token")?.value;
    }

    if (!campaign || !token) {
      return NextResponse.json(
        { error: "Missing required parameters: campaign and token" },
        { status: 400 },
      );
    }

    // Forward the request to the actual API with the token
    const response = await fetch(
      `${BASE_API_URL}/campaigns/count?campaign=${encodeURIComponent(campaign)}&token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(
        "Campaign count API error:",
        response.status,
        response.statusText,
      );

      // Try to get detailed error message from upstream
      let errorMessage = "Failed to count campaign visit";
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          // In case the body is just the error message string
          errorMessage = errorData;
        }
      } catch {
        // Ignore JSON parse error, use default message
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in campaign count BFF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
