import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_API_URL =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.RAILWAY_ENVIRONMENT_NAME !== "production"
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.RAILWAY_INTERNAL_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestion_id } = body;

    if (!suggestion_id) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: Missing token" },
        { status: 401 },
      );
    }

    const response = await fetch(`${BASE_API_URL}/value-suggestions/unvote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "JailbreakChangelogs-ValueSuggestions/1.0",
      },
      body: JSON.stringify({
        suggestion_id,
        owner: token,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: data.message || data.detail || "Failed to unvote" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error processing unvote:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
