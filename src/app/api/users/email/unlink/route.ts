import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;

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

  try {
    // Assuming POST for action, with token in query param as described
    const response = await fetch(
      `${BASE_API_URL}/users/email/unlink?token=${token}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.detail || errorData.message || "Failed to unlink email";
      return NextResponse.json(
        {
          message: errorMessage,
          detail: errorData.detail,
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
    console.error("Error unlinking email:", error);
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
