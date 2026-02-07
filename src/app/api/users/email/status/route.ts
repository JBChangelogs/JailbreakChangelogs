import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ linked: false }, { status: 200 });
  }

  try {
    const response = await fetch(
      `${BASE_API_URL}/users/email/linked?token=${token}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      // If error, assume false or handle specific codes
      return NextResponse.json({ linked: false });
    }

    const data = await response.json();
    // data is boolean true or false
    return NextResponse.json({ linked: data });
  } catch (error) {
    console.error("Error checking email status:", error);
    return NextResponse.json({ linked: false });
  }
}
