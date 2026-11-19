import { expect, mock, test } from "bun:test";

let failure: unknown;
const logError = mock(() => {});
const connection = {
  id: "123",
  username: "u",
  global_name: "u",
  roblox_id: "1",
};
mock.module("@/services/logger", () => ({
  createLogger: () => ({ error: logError }),
}));
mock.module("@/utils/api/api", () => ({
  fetchUserByRobloxId: async () => {
    if (failure !== undefined) throw failure;
    return connection;
  },
}));
const { fetchUserConnection } = await import("./userConnection");

test("fetchUserConnection suppresses banned-user logs and preserves unexpected failures", async () => {
  for (failure of [
    new Error("BANNED_USER: This user is banned."),
    new Error("Network failure"),
    "Unexpected rejection",
    undefined,
  ]) {
    logError.mockClear();
    expect(await fetchUserConnection("123")).toEqual(
      failure === undefined ? connection : null,
    );
    const shouldLog =
      failure !== undefined &&
      !(failure instanceof Error && failure.message.startsWith("BANNED_USER:"));
    expect(logError).toHaveBeenCalledTimes(shouldLog ? 1 : 0);
  }
});
