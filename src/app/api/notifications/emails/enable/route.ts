import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        {
          status: 401,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    const response = await fetch(`${BASE_API_URL}/notifications/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      let errorData: { detail?: string; message?: string; error?: string } = {};
      try {
        errorData = await response.json();
      } catch {
        // If JSON parsing fails, try to get text
        const text = await response.text().catch(() => "");
        console.error("Failed to parse error response:", text);
      }

      const errorMessage =
        errorData.detail ||
        errorData.message ||
        "Failed to enable email notifications";

      // Preserve the original status code from backend
      return NextResponse.json(
        {
          message: errorMessage,
          detail: errorData.detail,
          error: errorData.error,
        },
        {
          status: response.status,
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    // Attempt to parse JSON, if fails, return empty object or success message
    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error enabling email notifications:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}
