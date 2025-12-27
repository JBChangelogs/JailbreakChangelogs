import { fetchInventoryDataRefresh } from "@/utils/api";
import {
  validateTurnstileToken,
  getTurnstileErrorMessage,
} from "@/utils/turnstile";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { robloxId, turnstileToken } = body;

    if (!robloxId) {
      return new Response(JSON.stringify({ error: "robloxId is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Validate Turnstile token
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({
          error: "Verification required. Please complete the challenge.",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Get client IP for validation
    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validate the Turnstile token
    const validation = await validateTurnstileToken(
      turnstileToken,
      secretKey,
      clientIp,
      {
        expectedAction: "inventory_refresh",
      },
    );

    if (!validation.success) {
      const errorMessage = getTurnstileErrorMessage(validation["error-codes"]);
      console.error("Turnstile validation failed:", validation["error-codes"]);
      return new Response(
        JSON.stringify({
          error: errorMessage,
          turnstileError: true,
        }),
        {
          status: 403,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Proceed with inventory refresh
    const refreshedData = await fetchInventoryDataRefresh(robloxId);

    if (refreshedData && "error" in refreshedData) {
      return new Response(JSON.stringify(refreshedData), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify(refreshedData), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (error) {
    console.error("Error in inventory refresh API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
