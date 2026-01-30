import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${BASE_API_URL}/notifications/unread?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );

    if (!response.ok) {
      if (response.status === 404 || response.status === 522) {
        return NextResponse.json(
          { error: `Error: ${response.status}` },
          { status: response.status },
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }

    // Don't log expected errors like 404
    if (error instanceof Error && error.message.includes("status: 404")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.error("Error fetching unread notification count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
