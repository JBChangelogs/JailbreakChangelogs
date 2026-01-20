"use server";

import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";
import type { UserData } from "@/types/auth";

/**
 * Reads the auth token from HttpOnly cookies and fetches the current user on the server.
 * Returns null if missing/invalid.
 */
export async function getCurrentUser(): Promise<UserData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token || token === "undefined") return null;

    const response = await fetch(
      `${BASE_API_URL}/users/get/token?token=${encodeURIComponent(token)}&nocache=true`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;
    const user = (await response.json()) as UserData;
    return user;
  } catch {
    return null;
  }
}

/**
 * Checks if the auth token cookie exists (without validating it).
 */
export async function hasAuthSessionCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    return !!token && token !== "undefined";
  } catch {
    return false;
  }
}
