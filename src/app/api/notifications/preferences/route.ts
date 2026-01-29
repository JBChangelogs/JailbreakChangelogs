import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";
import { getCurrentUser } from "@/utils/serverSession";

type PreferenceEntry = {
  title: string;
  enabled: boolean;
};

export async function GET() {
  try {
    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const resp = await fetch(
      `${BASE_API_URL}/notifications/preferences?user_id=${encodeURIComponent(user.id)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      },
    );

    if (!resp.ok) {
      const errorText = await resp.text();
      return NextResponse.json(
        { error: errorText || "Failed to fetch notification preferences" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token || token === "undefined") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    if (!BASE_API_URL) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as {
      preferences?: PreferenceEntry[];
    } | null;

    const preferences = body?.preferences;
    if (
      !preferences ||
      !Array.isArray(preferences) ||
      preferences.length === 0
    ) {
      return NextResponse.json(
        { error: "preferences[] is required" },
        { status: 400 },
      );
    }

    // Send to upstream in the exact shape requested (token + preferences)
    const upstreamBody = { token, preferences };

    const resp = await fetch(`${BASE_API_URL}/notifications/preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
      cache: "no-store",
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      return NextResponse.json(
        { error: errorText || "Failed to update notification preferences" },
        { status: resp.status },
      );
    }

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
