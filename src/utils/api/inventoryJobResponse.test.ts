import { describe, expect, test } from "bun:test";

import { readInventoryJobResponse } from "./inventoryJobResponse";

describe("inventory export and deletion scheduling", () => {
  test("accepts an explicit scheduling confirmation from a successful response", async () => {
    const result = await readInventoryJobResponse(
      Response.json({ status: "scheduled" }, { status: 202 }),
      "Failed to schedule job",
    );

    expect(result).toEqual({ scheduled: true });
  });

  test("never reports scheduling success from HTTP status alone or a conflicting response", async () => {
    const fallback = "Failed to schedule job";
    const cases = [
      {
        response: Response.json({
          status: "scheduled",
          error: "Queue is full",
        }),
        message: "Queue is full",
      },
      { response: Response.json({}), message: fallback },
      {
        response: Response.json({ status: "scheduled" }, { status: 503 }),
        message: fallback,
      },
      {
        response: new Response("Upstream unavailable", { status: 200 }),
        message: fallback,
      },
    ];

    for (const { response, message } of cases) {
      expect(await readInventoryJobResponse(response, fallback)).toEqual({
        scheduled: false,
        message,
        unauthorized: false,
      });
    }
  });
});
