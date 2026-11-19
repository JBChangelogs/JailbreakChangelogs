import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";

function load(file: string, data: Record<string, unknown> = {}) {
  const queries: Array<{
    queryKey: string[];
    queryFn: () => unknown;
    enabled?: boolean;
  }> = [];
  const calls: Array<{ name: string; input: string }> = [];
  const exports = {} as {
    default: (props: { robloxId: string }) => {
      props: Record<string, unknown>;
    };
  };
  runInNewContext(
    transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      require: (id: string) => {
        if (id === "react/jsx-runtime")
          return { jsx: (_type: unknown, props: unknown) => ({ props }) };
        if (id === "@tanstack/react-query")
          return {
            useQuery: (options: (typeof queries)[number]) => {
              queries.push(options);
              const value = data[options.queryKey[0]];
              return {
                data: value,
                isPending: value === undefined,
                isFetched: value !== undefined,
                isError: false,
              };
            },
          };
        return new Proxy(
          {},
          {
            get: (_target, name: string) => (input: string) => {
              calls.push({ name, input });
              return Promise.resolve(null);
            },
          },
        );
      },
    },
  );
  return { render: exports.default, queries, calls };
}

test("OG and dupe requests start with the username while the profile is still pending", async () => {
  for (const [file, queryName, method] of [
    ["../OG/OGFinderDataStreamer.tsx", "og-search", "fetchOGSearchData"],
    [
      "../Dupes/DupeFinderDataStreamer.tsx",
      "dupe-finder",
      "fetchDupeFinderData",
    ],
  ]) {
    const app = load(file);
    app.render({ robloxId: "@v3kmw" });
    const query = app.queries.find((q) => q.queryKey[0] === queryName)!;
    expect(query.enabled).not.toBe(false);
    await query.queryFn();
    expect(app.calls).toEqual([{ name: method, input: "@v3kmw" }]);
  }
});

test("OG and dupe results keep numeric profile IDs after a username search", () => {
  const profile = { id: 123, name: "v3kmw", displayName: "V3kmw" };
  for (const [file, queryName, result] of [
    ["../OG/OGFinderDataStreamer.tsx", "og-search", { results: [], count: 0 }],
    ["../Dupes/DupeFinderDataStreamer.tsx", "dupe-finder", []],
  ] as const) {
    const app = load(file, {
      "roblox-profile": profile,
      [queryName]: result,
      "og-search-connection": null,
    });
    const view = app.render({ robloxId: "v3kmw" });
    expect(view.props.robloxId).toBe("123");
    expect(view.props.robloxUsers).toEqual({ "123": profile });
    expect(view.props.originalSearchTerm).toBe("v3kmw");
  }
});

test("an unscanned inventory uses the API's user ID without another username lookup", async () => {
  const app = load("../../app/inventories/InventoryDataLoader.tsx", {
    inventory: {
      result: {
        error: "inventory_not_found",
        message: "Inventory not found. In queue: position 0 (~1.8 s)",
        user_id: "123",
        queue_position: 0,
        queue_delay: 1.8,
      },
      networth: [],
      moneyHistory: [],
    },
  });
  const view = app.render({ robloxId: "v3kmw" });
  expect(view.props.robloxId).toBe("123");
  expect(view.props.originalSearchTerm).toBe("v3kmw");
  expect(view.props.errorCode).toBe("inventory_not_found");
  expect(view.props.initialQueue).toEqual({ position: 0, delay: 1.8 });
  expect(view.props.error).toBe(
    "Inventory not found. In queue: position 0 (~1.8 s)",
  );
  await app.queries[0].queryFn();
  expect(app.calls).toEqual([
    { name: "fetchInventoryData", input: "v3kmw" },
    { name: "fetchUserNetworth", input: "v3kmw" },
    { name: "fetchUserMoneyHistory", input: "v3kmw" },
  ]);
});

test("an unqueued missing inventory passes explicit null queue data", () => {
  const app = load("../../app/inventories/InventoryDataLoader.tsx", {
    inventory: {
      result: {
        error: "inventory_not_found",
        message: "Inventory not found.",
        user_id: "123",
        queue_position: null,
        queue_delay: null,
      },
    },
  });
  expect(app.render({ robloxId: "123" }).props.initialQueue).toEqual({
    position: null,
    delay: null,
  });
});
