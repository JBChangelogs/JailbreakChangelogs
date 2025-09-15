import { fetchUserMoneyRank } from "@/utils/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id parameter is required" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const userRank = await fetchUserMoneyRank(userId);

    if (!userRank) {
      return new Response(JSON.stringify({ error: "User rank not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify(userRank), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error in money rank API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
