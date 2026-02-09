import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { content, item_id, item_type, parent_id } = (await request.json()) as {
    content?: string;
    item_id?: number;
    item_type?: string;
    parent_id?: number | null;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("jbcl_token")?.value;
  if (!token || !content || !item_id || !item_type) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/comments/add`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      content,
      item_id,
      item_type,
      owner: token,
      // Only include parent_id when it's provided (non-null/undefined)
      ...(typeof parent_id === "number" ? { parent_id } : {}),
    }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Try to parse JSON error response
    let errorBody;
    try {
      errorBody = await upstream.json();
    } catch {
      // If parsing fails (e.g., HTML error page), use a default error structure
      // Don't log 404 or 403 as errors
      if (upstream.status !== 404 && upstream.status !== 403) {
        console.error("Comment add failed: Non-JSON response", upstream.status);
      }
      errorBody = {
        error: "unknown_error",
        message: "Failed to add comment",
      };
    }

    return NextResponse.json(errorBody, { status: upstream.status });
  }

  // Parse and return the successful JSON response
  const responseData = await upstream.json();
  return NextResponse.json(responseData, { status: upstream.status });
}
