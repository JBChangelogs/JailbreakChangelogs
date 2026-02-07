import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Assuming POST for action, with token in query param as described
    const response = await fetch(
      `${BASE_API_URL}/users/email/unlink?token=${token}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { message: errorData.message || "Failed to unlink email" },
        { status: response.status },
      );
    }

    const data = await response.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error unlinking email:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
