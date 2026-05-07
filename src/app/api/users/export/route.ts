import { NextResponse } from "next/server";
import { INVENTORY_API_URL } from "@/utils/api";
import { cookies } from "next/headers";
import { createLogger } from "@/services/logger";

const log = createLogger("API");

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbcl_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!INVENTORY_API_URL) {
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${INVENTORY_API_URL}/user/export?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      log.error("Export failed:", { status: response.status, body: errorText });
      return NextResponse.json(
        { error: "Export failed" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    log.error("Export error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
