import { NextRequest, NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign, token } = body;

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
      return NextResponse.json(
        { error: "Failed to count campaign visit" },
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
