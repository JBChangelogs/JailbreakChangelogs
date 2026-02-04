import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(
        `${BASE_API_URL}/notifications/unread?token=${encodeURIComponent(token)}`,
        {
          cache: "no-store",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        // Don't retry on certain status codes
        if (response.status === 404 || response.status === 401) {
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
      lastError = error as Error;

      // Check if we should retry
      const isRetryable =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.name === "TimeoutError" ||
          error.message.includes("fetch failed") ||
          error.message.includes("status: 5"));

      if (attempt === maxRetries || !isRetryable) {
        break;
      }

      // Exponential backoff
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Handle final error after all retries
  if (
    lastError instanceof Error &&
    (lastError.name === "TimeoutError" || lastError.name === "AbortError")
  ) {
    return NextResponse.json({ error: "Request timed out" }, { status: 504 });
  }

  if (lastError instanceof Error && lastError.message.includes("status: 404")) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  console.error(
    "Error fetching unread notification count after retries:",
    lastError,
  );
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
