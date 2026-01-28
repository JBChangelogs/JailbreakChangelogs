import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export async function GET() {
  try {
    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const resp = await fetch(
      `${BASE_API_URL}/notifications/preferences/available`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch available preferences" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching available notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
