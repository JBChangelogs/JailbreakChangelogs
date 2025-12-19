import { NextResponse } from "next/server";
import { BASE_API_URL } from "@/utils/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { message: "Missing code parameter" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(
      `${BASE_API_URL}/codes/validate?code=${code}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (upstream.status === 404) {
      return NextResponse.json({
        valid: false,
        redeemed: false,
        premiumtype: 0,
      });
    }

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Ignore parse errors, data will be undefined
    }

    // If request succeeded, or if it failed with 400 but returned validation data (redeemed: true case)
    if (
      upstream.ok ||
      (upstream.status === 400 && data && typeof data.valid === "boolean")
    ) {
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { message: "Validation failed" },
      { status: upstream.status },
    );
  } catch (error) {
    console.error("Error validating code:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
