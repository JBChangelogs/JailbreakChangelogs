import { getCurrentUser } from "@/utils/serverSession";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ user }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
