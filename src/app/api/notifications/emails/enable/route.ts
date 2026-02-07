import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const response = await fetch(
      `${BASE_API_URL}/notifications/emails/enable`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          message: errorData.message || "Failed to enable email notifications",
          error: errorData.error,
        },
        { status: response.status },
      );
    }

    // Attempt to parse JSON, if fails, return empty object or success message
    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error enabling email notifications:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
