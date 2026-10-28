import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import {
  applyFriendUpdate,
  FRIEND_REQUESTS_KEY,
  FRIENDS_KEY,
  friendshipStatus,
} from "./useFriendship";

const user = (id: string) => ({ id, username: id });

test("friend status prefers friends, then incoming, then outgoing", () => {
  const requests = {
    incoming: [{ ...user("2"), created_at: 0 }],
    outgoing: [{ ...user("3"), created_at: 0 }],
  };
  const friends = [{ ...user("1"), friends_since: 0 }];

  expect(friendshipStatus("1", friends, requests)).toBe("friends");
  expect(friendshipStatus("2", friends, requests)).toBe("incoming");
  expect(friendshipStatus("3", friends, requests)).toBe("outgoing");
  expect(friendshipStatus("4", friends, requests)).toBe("none");
  // Still loading: nothing known yet.
  expect(friendshipStatus("1", undefined, undefined)).toBe("none");
});

test("friend_update frames change the cached status without a refetch", () => {
  const client = new QueryClient();
  const them = "659865209741246514";
  client.setQueryData(FRIENDS_KEY, [{ ...user(them), friends_since: 1 }]);
  client.setQueryData(FRIEND_REQUESTS_KEY, { incoming: [], outgoing: [] });
  const status = () =>
    friendshipStatus(
      them,
      client.getQueryData(FRIENDS_KEY),
      client.getQueryData(FRIEND_REQUESTS_KEY),
    );

  // They unfriended you: the frame from the bug report.
  applyFriendUpdate(client, them, "none");
  expect(status()).toBe("none");

  // You asked, they accepted: moves from sent to friends, profile kept.
  client.setQueryData(FRIEND_REQUESTS_KEY, {
    incoming: [],
    outgoing: [{ ...user(them), created_at: 1 }],
  });
  applyFriendUpdate(client, them, "friends");
  expect(status()).toBe("friends");
  expect(
    client.getQueryData<{ username: string }[]>(FRIENDS_KEY)?.[0]?.username,
  ).toBe(them);
});

test("friend_update reuses a known profile for any status, else refetches", () => {
  const client = new QueryClient();
  const them = "42";
  client.setQueryData(FRIENDS_KEY, []);
  client.setQueryData(FRIEND_REQUESTS_KEY, {
    incoming: [{ ...user(them), created_at: 1 }],
    outgoing: [],
  });
  const status = () =>
    friendshipStatus(
      them,
      client.getQueryData(FRIENDS_KEY),
      client.getQueryData(FRIEND_REQUESTS_KEY),
    );

  // You accepted their request in another tab.
  applyFriendUpdate(client, them, "friends");
  expect(status()).toBe("friends");

  // Unfriended, then you sent a fresh request from another tab.
  applyFriendUpdate(client, them, "none");
  expect(status()).toBe("none");
  client.setQueryData(FRIEND_REQUESTS_KEY, {
    incoming: [],
    outgoing: [],
  });
  client.setQueryData(FRIENDS_KEY, [{ ...user(them), friends_since: 1 }]);
  applyFriendUpdate(client, them, "outgoing");
  expect(status()).toBe("outgoing");
});
