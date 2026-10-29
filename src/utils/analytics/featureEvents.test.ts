import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadCallback(
  file: string,
  name: string,
  scope: Record<string, unknown>,
) {
  const source = ts.createSourceFile(
    file,
    readFileSync(new URL(`../../${file}`, import.meta.url), "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  let callback: ts.Node | undefined;
  function visit(node: ts.Node) {
    if (callback) return;
    if (
      name === "effect" &&
      ts.isCallExpression(node) &&
      node.expression.getText(source) === "useEffect"
    ) {
      callback = node.arguments[0];
    } else if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(source) === name &&
      node.initializer
    ) {
      callback = ts.isCallExpression(node.initializer)
        ? node.initializer.arguments[0]
        : node.initializer;
    }
    if (!callback) ts.forEachChild(node, visit);
  }
  visit(source);
  if (!callback) throw new Error(`Missing callback: ${file}:${name}`);
  const exports = {} as { callback: (...args: unknown[]) => unknown };
  runInNewContext(
    ts.transpileModule(`exports.callback = ${callback.getText(source)};`, {})
      .outputText,
    { ...scope, exports },
  );
  return exports.callback;
}

function setupScope(overrides: Record<string, unknown> = {}) {
  const events: Array<{ name: string; props?: Record<string, unknown> }> = [];
  const navigation: string[] = [];
  const scope = {
    trackWebEvent: (name: string, props?: Record<string, unknown>) =>
      events.push({ name, props }),
    trackEvent: () => {},
    window: { rybbit: { event: () => {} } },
    performance: { now: () => 100 },
    toast: {
      success: () => {},
      error: () => {},
      info: () => {},
      loading: () => 1,
    },
    log: { error: () => {} },
    router: { push: (path: string) => navigation.push(path) },
    MaxStreamsError: class extends Error {},
    setIsLoading: () => {},
    setIsSearching: () => {},
    setIsSuggestionsOpen: () => {},
    setSearchError: () => {},
    getRobloxId: async () => "123",
    setSubmitting: () => {},
    setRateLimitUntil: () => {},
    ...overrides,
  };
  return { events, navigation, scope };
}

test("search submissions record input type without sending the query", async () => {
  for (const [file, handler, feature] of [
    ["components/OG/OGFinderResults.tsx", "handleSearch", "og"],
    ["components/Dupes/DupeSearchInput.tsx", "performSearch", "dupe"],
    ["components/Inventory/SearchForm.tsx", "handleSubmit", "inventory"],
  ]) {
    const app = setupScope();
    const callback = loadCallback(file, handler, app.scope);
    const search = (input: string) =>
      feature === "inventory"
        ? loadCallback(file, handler, { ...app.scope, searchId: input })({
            preventDefault() {},
          })
        : callback(input);
    await search("");
    expect(app.events).toHaveLength(0);
    await search("PrivateUsername");
    await search("123456");
    expect(app.events).toEqual([
      { name: `${feature}_search`, props: { input_type: "username" } },
      { name: `${feature}_search`, props: { input_type: "id" } },
    ]);
    expect(app.navigation).toHaveLength(2);
  }
});

test("search lookup failures report stable codes", async () => {
  for (const [file, handler, feature] of [
    ["components/OG/OGFinderResults.tsx", "handleSearch", "og"],
    ["components/Dupes/DupeSearchInput.tsx", "performSearch", "dupe"],
    ["components/Inventory/SearchForm.tsx", "handleSubmit", "inventory"],
  ]) {
    for (const code of ["user_not_found", "lookup_failed", "lookup_busy"]) {
      const app = setupScope();
      app.scope.getRobloxId = async () => {
        if (code === "user_not_found") return "";
        if (code === "lookup_busy")
          throw new app.scope.MaxStreamsError("private error");
        throw new Error("private error");
      };
      const callback = loadCallback(file, handler, {
        ...app.scope,
        searchId: "PrivateUsername",
      });
      await callback(
        feature === "inventory" ? { preventDefault() {} } : "PrivateUsername",
      );
      expect(app.events.at(-1)).toEqual({
        name: `${feature}_search_failed`,
        props: { code },
      });
      expect(app.navigation).toHaveLength(0);
    }
  }
});

test("OG entry form and dupe suggestions record searches", () => {
  const og = setupScope({ searchId: "PrivateUsername" });
  loadCallback(
    "components/OG/OGFinderClient.tsx",
    "handleSearch",
    og.scope,
  )({ preventDefault() {} });
  expect(og.events).toEqual([
    { name: "og_search", props: { input_type: "username" } },
  ]);
  const dupe = setupScope({
    searchId: "private",
    cancelPendingSuggestionsFetch: () => {},
    isUserEditRef: { current: true },
    setSuggestions: () => {},
    setSearchId: () => {},
  });
  loadCallback(
    "components/Dupes/DupeSearchInput.tsx",
    "goToOwner",
    dupe.scope,
  )({ id: "123", name: "PrivateUsername" });
  expect(dupe.events).toEqual([
    { name: "dupe_search", props: { input_type: "suggestion" } },
  ]);
});

test("result events count empty results as success and suppress duplicate effects", () => {
  for (const feature of ["og", "dupe", "inventory"]) {
    for (const failed of [false, true]) {
      const app = setupScope({
        robloxId: "123",
        initialData: null,
        error: "private",
        isUserFound: !failed,
        isInventoryNotFoundError: !failed,
        externalIsLoading: false,
        resultCount: 0,
        reportedResult: { current: null },
      });
      if (feature === "og" && !failed)
        Object.assign(app.scope, {
          initialData: { results: [] },
          error: undefined,
        });
      const effect = loadCallback(
        feature === "og"
          ? "components/OG/OGFinderResults.tsx"
          : feature === "dupe"
            ? "components/Dupes/DupeFinderClient.tsx"
            : "app/inventories/InventoryCheckerClient.tsx",
        "effect",
        app.scope,
      );
      effect();
      effect();
      expect(app.events).toEqual([
        {
          name: `${feature}_search_${failed ? "failed" : "result"}`,
          props: failed ? { code: "lookup_failed" } : { result_count: 0 },
        },
      ]);
    }
  }
});

test("quick and custom offers record API outcomes once without notes or IDs", async () => {
  class RateLimitError extends Error {
    retryAfter = 60;
  }
  for (const handler of ["sendExactOffer", "sendCustomOffer"]) {
    for (const outcome of [
      "success",
      "failure",
      "rate_limited",
      "callback_failure",
    ]) {
      const app = setupScope({
        RateLimitError,
        trade: { id: 123, offering: [], requesting: [] },
        note: "private note",
        offeringItems: [],
        requestingItems: [],
        sanitizeText: (value: string) => value,
        customTradeTypeSet: new Set(),
        createTradeOffer: async () => {
          if (outcome === "rate_limited") throw new RateLimitError();
          if (outcome === "failure") throw new Error("private failure");
        },
        onOfferSent: () => {
          if (outcome === "callback_failure") throw new Error("UI failure");
        },
        resetForm: () => {},
        onClose: () => {},
      });
      await loadCallback(
        "components/trading/MakeOfferDialog.tsx",
        handler,
        app.scope,
      )();
      expect(app.events).toHaveLength(1);
      expect(app.events[0].name).toBe(
        outcome === "success" || outcome === "callback_failure"
          ? "trade_offer_sent"
          : "trade_offer_failed",
      );
      expect(app.events[0].props?.type).toBe(
        handler === "sendExactOffer" ? "quick" : "custom",
      );
      if (outcome === "rate_limited")
        expect(app.events[0].props?.code).toBe("rate_limited");
      expect(JSON.stringify(app.events)).not.toContain("private");
      expect(JSON.stringify(app.events)).not.toContain("123");
    }
  }
});

test("trade ads record all HTTP outcomes once, including early returns", async () => {
  for (const status of [200, 400, 401, 409, 429, 500, 0]) {
    const response = new Response(
      JSON.stringify({ message: "private failure", error: "offering_limit" }),
      { status: status || 500 },
    );
    const app = setupScope({
      offeringItems: [{ id: 1 }],
      requestingItems: [{ id: 2 }],
      tradeNote: "private note",
      isCustomTradeItem: () => false,
      checkTradeAdDuration: () => true,
      expirationHours: 24,
      userData: null,
      isAuthenticated: true,
      process: { env: { NEXT_PUBLIC_API_URL: "https://api.example.com" } },
      buildApiFetchRequest: () => ({ url: "/trade", headers: {} }),
      buildV2CreateItems: () => [],
      sanitizeText: (value: string) => value,
      fetch: async () => {
        if (!status) throw new Error("offline");
        return response;
      },
      setLoginModal: () => {},
      document: { querySelector: () => null },
      getResponseErrorMessage: async () => "private failure",
      tradeDraftStorageKey: null,
      setOfferingItems: () => {},
      setRequestingItems: () => {},
      setTradeNote: () => {},
      onSuccess: () => {
        throw new Error("UI failure");
      },
    });
    await loadCallback(
      "components/trading/TradeAdForm.tsx",
      "handleSubmit",
      app.scope,
    )();
    expect(app.events).toHaveLength(1);
    expect(app.events[0].name).toBe(
      status === 200 ? "trade_ad_posted" : "trade_ad_failed",
    );
    if (status !== 200)
      expect(app.events[0].props?.code).toBe(
        status ? `http_${status}` : "request_failed",
      );
    expect(JSON.stringify(app.events)).not.toContain("private");
  }
});

test("inventory outcomes distinguish queued from completed and report only once", () => {
  for (const [status, phase, event] of [
    ["completed", "queued", "inventory_scan_queued"],
    ["completed", "completed", "inventory_scan_completed"],
    ["error", "server_full", "inventory_scan_failed"],
  ]) {
    const app = setupScope({ status, phase, scanStartedAtRef: { current: 0 } });
    const effect = loadCallback(
      "hooks/useScanWebSocket.ts",
      "effect",
      app.scope,
    );
    effect();
    effect();
    expect(app.events).toEqual([
      {
        name: event,
        props: {
          duration_ms: 100,
          ...(status === "error" ? { code: phase } : {}),
        },
      },
    ]);
  }
});

test("inventory requests report disabled scanning and missing users", () => {
  for (const [userId, enabled, code] of [
    ["", true, "missing_user"],
    ["123", false, "disabled"],
    ["123", true, ""],
  ] as const) {
    let connections = 0;
    const app = setupScope({
      userId,
      ENABLE_WS_SCAN: enabled,
      setError: () => {},
      setStatus: () => {},
      setPhase: () => {},
      setForceShowError: () => {},
      setTurnstileToken: () => {},
      scanStartedAtRef: { current: null },
      connect: () => connections++,
    });
    loadCallback("hooks/useScanWebSocket.ts", "startScan", app.scope)();
    expect(app.events[0]).toEqual({
      name: "inventory_scan_requested",
      props: undefined,
    });
    if (code)
      expect(app.events[1]).toEqual({
        name: "inventory_scan_failed",
        props: { code },
      });
    expect(connections).toBe(code ? 0 : 1);
  }
});
