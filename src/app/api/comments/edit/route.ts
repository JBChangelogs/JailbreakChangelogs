import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { BASE_API_URL } from "@/utils/api";

export async function POST(request: Request) {
  const { id, content, item_type } = (await request.json()) as {
    id?: number;
    content?: string;
    item_type?: string;
  };
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token || !id || !content || !item_type) {
    return NextResponse.json({ message: "Bad Request" }, { status: 400 });
  }

  const upstream = await fetch(`${BASE_API_URL}/comments/edit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, content, item_type, author: token }),
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
        console.error(
          "Comment edit failed: Non-JSON response",
          upstream.status,
        );
      }
      errorBody = {
        error: "unknown_error",
        message: "Failed to edit comment",
      };
    }

    return NextResponse.json(errorBody, { status: upstream.status });
  }

  // Parse and return the successful JSON response
  const responseData = await upstream.json();
  return NextResponse.json(responseData, { status: upstream.status });
}
