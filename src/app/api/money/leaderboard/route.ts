import { fetchMoneyLeaderboard } from "@/utils/api/api";

export async function GET() {
  try {
    const leaderboard = await fetchMoneyLeaderboard();

    return new Response(JSON.stringify(leaderboard), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("[API] Error fetching money leaderboard:", error);

    return new Response(
      JSON.stringify({ error: "Failed to fetch money leaderboard" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
