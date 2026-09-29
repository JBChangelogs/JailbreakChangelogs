import { BASE_API_URL } from "@/utils/api/api";

export async function GET() {
  if (!BASE_API_URL) {
    return new Response("API URL not configured", { status: 500 });
  }

  const response = await fetch(`${BASE_API_URL}/v1/items/sitemap`);
  if (!response.ok) {
    return new Response("Failed to fetch items sitemap", {
      status: response.status,
    });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/xml",
    },
  });
}
