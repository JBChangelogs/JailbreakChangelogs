"use server";

import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";
import type { UserData } from "@/types/auth";

/**
 * Reads the auth token from the request cookie and fetches the current user on the server.
 * Returns null if missing/invalid.
 */
export async function getCurrentUser(): Promise<UserData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  if (!token || token === "undefined") return null;

  const maxRetries = 2; // Keep retries low for session to avoid long hangs

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
      const response = await fetch(
        buildApiUrlWithDevToken(BASE_API_URL, "/users/me"),
        {
          cache: "no-store",
          credentials: "include",
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const user = (await response.json()) as UserData;
      return user;
    } catch (error) {
      if (attempt === maxRetries) break;

      // Only retry on network/timeout errors
      const isRetryable =
        error instanceof Error &&
        (error.name === "AbortError" ||
          error.message.includes("fetch failed") ||
          error.message.includes("status: 5"));

      if (!isRetryable) break;

      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}
