import { describe, expect, test } from "bun:test";
import { updateTrackerJoinHistory } from "./trackerJoinHistory";

const first = { user_id: "1", display_name: "First", joined_at: 100 };
const second = { user_id: "2", display_name: "Second", joined_at: 101 };

describe("tracker join history", () => {
  test("seeds all servers and replaces one server's roster on updates", () => {
    const synced = updateTrackerJoinHistory(
      {},
      {
        action: "join_history_sync",
        servers: { serverA: [first], serverB: [second] },
      },
    );

    const joined = updateTrackerJoinHistory(synced, {
      action: "update_join_history",
      data: { server_id: "serverA" },
      users: [first, second],
    });
    expect(joined).toEqual({ serverA: [first, second], serverB: [second] });

    const corrected = updateTrackerJoinHistory(joined, {
      action: "update_join_history",
      data: { server_id: "serverA" },
      users: [],
    });
    expect(corrected).toEqual({ serverA: [], serverB: [second] });
  });
});
