import { expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, transpileModule } from "typescript";
import type { MouseEvent, SetStateAction } from "react";
import type { Suggestion } from "@/components/Items/Suggestions/types";
import type { useSuggestionVoting } from "./useSuggestionVoting";

test("voters modal follows feed cache updates and optimistic vote rollback without snapshot syncing", async () => {
  const client = new QueryClient();
  const key = ["value-suggestions-feed", "", null, 1];
  const suggestion: Suggestion = {
    id: 1,
    item_id: 1,
    field: "cash_value",
    current_value: "1m",
    suggested_value: "2m",
    reason: "Reason",
    status: "pending",
    upvotes: 0,
    downvotes: 0,
    is_vt: 0,
    created_at: 1,
    updated_at: 1,
    user: { id: "author" },
    votes: { upvotes: [], downvotes: [] },
  };
  client.setQueryData(key, [suggestion]);
  const slots: unknown[] = [];
  let cursor = 0;
  let finishVote: (value: unknown) => void = () => {};
  const exports = {} as {
    useSuggestionVoting: (
      options: Record<string, unknown>,
    ) => ReturnType<typeof useSuggestionVoting>;
  };
  runInNewContext(
    transpileModule(
      readFileSync(
        new URL("./useSuggestionVoting.ts", import.meta.url),
        "utf8",
      ),
      {
        compilerOptions: { module: ModuleKind.CommonJS },
      },
    ).outputText,
    {
      exports,
      fetch: () =>
        new Promise((resolve) => {
          finishVote = resolve;
        }),
      require: (name: string) => {
        if (name === "react")
          return {
            useState: (initial: unknown) => {
              const index = cursor++;
              if (!(index in slots)) slots[index] = initial;
              return [
                slots[index],
                (update: unknown) => {
                  slots[index] =
                    typeof update === "function"
                      ? update(slots[index])
                      : update;
                },
              ];
            },
            useEffect: () => {},
            useCallback: (callback: unknown) => callback,
          };
        if (name === "@tanstack/react-query")
          return { useQueryClient: () => client };
        if (name === "@/services/logger")
          return { createLogger: () => ({ error: () => {} }) };
        if (name === "@/utils/api/apiDevToken")
          return {
            buildApiFetchRequest: () => ({ url: "/vote", headers: {} }),
          };
        if (name === "@/utils/api/ban") return { parseBan: () => null };
        if (name === "sonner")
          return { toast: { info: () => {}, error: () => {} } };
        return {};
      },
    },
  );
  const render = () => {
    cursor = 0;
    return exports.useSuggestionVoting({
      suggestions: client.getQueryData<Suggestion[]>(key),
      setSuggestions: (update: SetStateAction<Suggestion[]>) =>
        client.setQueryData<Suggestion[]>(key, (previous = []) =>
          typeof update === "function" ? update(previous) : update,
        ),
      user: { id: "current" },
      isAuthenticated: true,
      sort: null,
      page: 1,
    });
  };
  const event = {
    stopPropagation: () => {},
    preventDefault: () => {},
  } as MouseEvent;
  render().openVotersModal(suggestion, "down", event);
  expect(render().votersOpen).toBe(true);
  expect(render().votersTab).toBe("down");
  const newVotes = [{ created_at: 2, user: { id: "remote" } }];
  const updated = {
    ...suggestion,
    upvotes: 1,
    votes: { upvotes: newVotes, downvotes: [] },
  };
  client.setQueryData(key, [updated]);
  expect(render().activeVoters?.up).toBe(
    client.getQueryData<Suggestion[]>(key)?.[0].votes.upvotes,
  );
  expect(render().activeVoters?.upCount).toBe(1);
  const vote = render().handleVote(updated, "upvote", event);
  expect(render().activeVoters?.upCount).toBe(2);
  expect(render().activeVoters?.up.map((voter) => voter.user.id)).toEqual([
    "remote",
    "current",
  ]);
  expect(render().votersTab).toBe("down");
  finishVote({ ok: false, status: 500, json: async () => ({}) });
  await vote;
  expect(render().activeVoters?.upCount).toBe(1);
  expect(render().activeVoters?.up.map((voter) => voter.user.id)).toEqual([
    "remote",
  ]);
  const other = { ...suggestion, id: 2, upvotes: 5 };
  client.setQueryData(key, [updated, other]);
  render().openVotersModal(other, "down", event);
  expect(render().activeVoters?.upCount).toBe(5);
  render().setVotersOpen(false);
  expect(render().activeVoters).toBeNull();
  expect(render().votersOpen).toBe(false);
  client.clear();
});
