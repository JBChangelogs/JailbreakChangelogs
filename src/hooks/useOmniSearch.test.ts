import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

/**
 * Runs useOmniSearch with a minimal React (state, effects) and a useQuery
 * that fetches each enabled key once, recording every term sent to the API.
 * `type` re-renders with new input; `settle` lets the 150 ms debounce fire.
 */
function harness() {
  const sent: string[] = [];
  const fetched = new Set<string>();
  const state: unknown[] = [];
  const effects: { deps: unknown[]; cleanup?: () => void }[] = [];
  const timers = new Map<number, () => void>();
  let nextTimer = 0;
  let slot = 0;
  let effectSlot = 0;
  let input = { query: "", enabled: false };

  const react = {
    useState(initial: unknown) {
      const i = slot++;
      if (!(i in state)) state[i] = initial;
      return [state[i], (value: unknown) => ((state[i] = value), render())];
    },
    useEffect(effect: () => (() => void) | void, deps: unknown[]) {
      const i = effectSlot++;
      const prev = effects[i];
      if (prev && deps.every((dep, d) => Object.is(dep, prev.deps[d]))) return;
      prev?.cleanup?.();
      effects[i] = { deps, cleanup: effect() ?? undefined };
    },
  };
  const reactQuery = {
    keepPreviousData: Symbol("keepPreviousData"),
    useQuery(options: {
      queryKey: unknown[];
      enabled: boolean;
      queryFn: (ctx: { signal: AbortSignal }) => unknown;
    }) {
      // Like React Query: one fetch per key while it's cached.
      const key = JSON.stringify(options.queryKey);
      if (options.enabled && !fetched.has(key)) {
        fetched.add(key);
        void options.queryFn({ signal: new AbortController().signal });
      }
      return { isFetching: false };
    },
  };

  const exports = {} as {
    useOmniSearch: (
      query: string,
      options: { limit: number; enabled: boolean },
    ) => unknown;
  };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./useOmniSearch.ts", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      AbortController,
      window: {
        setTimeout: (fn: () => void) => (
          timers.set(++nextTimer, fn),
          nextTimer
        ),
        clearTimeout: (id: number) => timers.delete(id),
      },
      require: (name: string) => {
        if (name === "react") return react;
        if (name === "@tanstack/react-query") return reactQuery;
        if (name === "@/utils/api/omniSearch")
          return { fetchOmniSearch: (term: string) => sent.push(term) };
        throw new Error(`unexpected import ${name}`);
      },
    },
  );

  function render() {
    slot = 0;
    effectSlot = 0;
    exports.useOmniSearch(input.query, { limit: 8, enabled: input.enabled });
  }
  return {
    sent,
    type(query: string, enabled: boolean) {
      input = { query, enabled };
      render();
    },
    settle() {
      const pending = [...timers.values()];
      timers.clear();
      pending.forEach((fn) => fn());
    },
  };
}

test("typing a name after a bare @ never searches the bare filter", () => {
  const search = harness();
  // "@" alone is disabled (it would list every user); the user pauses on it.
  search.type("@", false);
  search.settle();
  // A name makes it searchable now, but the settled term is still "@".
  search.type("@j", true);
  expect(search.sent).toEqual([]);
  search.settle();
  expect(search.sent).toEqual(["@j"]);
});

test("leaving an inventory check never searches the check", () => {
  const search = harness();
  search.type("check:123456", false);
  search.settle();
  search.type("jakobiis", true);
  expect(search.sent).toEqual([]);
  search.settle();
  expect(search.sent).toEqual(["jakobiis"]);
});

test("a term that becomes disabled is not searched", () => {
  const search = harness();
  search.type("torpedo", true);
  search.settle();
  expect(search.sent).toEqual(["torpedo"]);
  search.type("check:1", false);
  search.settle();
  expect(search.sent).toEqual(["torpedo"]);
});
