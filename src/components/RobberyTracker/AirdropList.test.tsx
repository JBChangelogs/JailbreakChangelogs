import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from "typescript";
import { updateTrackerJoinHistory } from "@/hooks/trackerJoinHistory";
import type { TrackerJoinReport } from "@/hooks/trackerJoinHistory";
import type { AirdropData } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { getAirdropKey } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import AirdropList, { filterAirdrops } from "./AirdropList";
import AirdropCard from "./AirdropCard";

const joinProps = { joinedUsers: [], onJoin: () => {} };

function renderCard(card: ReactNode) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {card}
    </QueryClientProvider>,
  );
}

const easy: AirdropData = {
  location: "CactusValley",
  color: "Brown",
  x: 10,
  z: 20,
  gone_at: 2000,
  server_time: 12,
  timestamp: 1000,
};
const hard: AirdropData = {
  ...easy,
  location: "Dunes",
  color: "Red",
  timestamp: 1100,
  server: {
    job_id: "test-server",
    server_time: 12,
    timestamp: 1100,
    bot_id: 1,
    players: Array.from({ length: 9 }, (_, i) => ({
      user_id: String(i),
      username: null,
      team: "Criminal",
      level: 1,
      has_season_pass: false,
      money: 0,
      xp: 0,
      gamepasses: [],
    })),
  },
};

test("difficulty uses filter chips while locations stay in tabs", () => {
  const markup = renderCard(
    <AirdropList
      airdrops={[]}
      searchQuery=""
      serverSize="all"
      timeSort="newest"
      serverRegions={{}}
      joinHistory={{}}
      onJoin={() => {}}
    />,
  );
  expect(markup).toContain('role="group" aria-label="Airdrop difficulty"');
  expect(markup).toMatch(/aria-pressed="true"[^>]*>All Difficulties<\/button>/);
  for (const label of ["Easy", "Medium", "Hard"])
    expect(markup).toMatch(
      new RegExp(`aria-pressed="false"[^>]*>${label}</button>`),
    );
  expect(markup.match(/role="tablist"/g)).toHaveLength(1);
  expect(markup).toContain('aria-label="Airdrop location"');
});

test("airdrop filters combine location, difficulty, search and server size", () => {
  const drops = [easy, hard, { ...easy, color: "Blue" as const }];
  expect(
    filterAirdrops(drops, "Dunes", "Red", " red ", "big", "newest"),
  ).toEqual([hard]);
  expect(
    filterAirdrops(
      drops,
      "CactusValley",
      "Brown",
      "cactus valley",
      "small",
      "newest",
    ),
  ).toEqual([easy]);
  expect(filterAirdrops(drops, "all", "Blue", "", "all", "newest")).toEqual([
    drops[2],
  ]);
  expect(filterAirdrops(drops, "Dunes", "Brown", "", "all", "newest")).toEqual(
    [],
  );
  expect(
    filterAirdrops(drops, "all", "all", "", "small", "newest"),
  ).not.toContain(hard);
});

test("airdrop time sorting never mutates the live snapshot", () => {
  const drops = [easy, hard];
  expect(filterAirdrops(drops, "all", "all", "", "all", "newest")).toEqual([
    hard,
    easy,
  ]);
  expect(filterAirdrops(drops, "all", "all", "", "all", "oldest")).toEqual([
    easy,
    hard,
  ]);
  expect(drops).toEqual([easy, hard]);
  expect(getAirdropKey(hard)).not.toBe(getAirdropKey({ ...hard, x: 30 }));
});

test("airdrop cards restore difficulty, location and server actions", () => {
  for (const [color, label] of [
    ["Brown", "Easy"],
    ["Blue", "Medium"],
    ["Red", "Hard"],
  ] as const) {
    const markup = renderCard(
      <AirdropCard
        {...joinProps}
        airdrop={{ ...hard, color }}
        useExternalRegionData
      />,
    );
    expect(markup).toContain(label);
    expect(markup).toContain("Dunes Airdrop");
    expect(markup).toContain("Join");
    expect(markup).toContain("Location");
    expect(markup).toContain("Logged");
  }
  const markup = renderCard(
    <AirdropCard {...joinProps} airdrop={easy} useExternalRegionData />,
  );
  expect(markup).toContain("Cactus Valley Airdrop");
  expect(markup).not.toContain("Join Server");
});

test("airdrop cards show synced server joins and follow roster updates", () => {
  const first = { user_id: "123", display_name: "First", joined_at: 100 };
  const second = { user_id: "456", display_name: "Second", joined_at: 101 };
  let joinHistory = updateTrackerJoinHistory(
    {},
    {
      action: "join_history_sync",
      servers: { "test-server": [first], "other-server": [second] },
    },
  );
  const render = () =>
    renderCard(
      <AirdropList
        airdrops={[hard]}
        searchQuery=""
        serverSize="all"
        timeSort="newest"
        serverRegions={{}}
        joinHistory={joinHistory}
        onJoin={() => {}}
      />,
    );
  expect(render()).toContain("/users/123");
  expect(render()).not.toContain("/users/456");
  joinHistory = updateTrackerJoinHistory(joinHistory, {
    action: "update_join_history",
    data: { server_id: "test-server" },
    users: [first, second],
  });
  expect(render()).toContain("2 people joined");
  joinHistory = updateTrackerJoinHistory(joinHistory, {
    action: "update_join_history",
    data: { server_id: "test-server" },
    users: [],
  });
  expect(render()).not.toContain("people joined");
  expect(render()).not.toContain("/users/123");
});

test("airdrop joins report before opening Roblox and map opens track their location", () => {
  type Node = { type: unknown; props: Record<string, unknown> };
  const nodes = (value: unknown): Node[] => {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object" || !("props" in value)) return [];
    const node = value as Node;
    return [node, ...nodes(node.props.children)];
  };
  const actions: unknown[] = [];
  const events: unknown[] = [];
  const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
  const exports = {} as { default: (props: object) => Node };
  runInNewContext(
    transpileModule(
      readFileSync(new URL("./AirdropCard.tsx", import.meta.url), "utf8"),
      {
        compilerOptions: {
          module: ModuleKind.CommonJS,
          jsx: JsxEmit.ReactJSX,
          target: ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      window: {
        setTimeout: () => 1,
        location: { assign: (url: string) => actions.push(url) },
      },
      require: (name: string) => {
        if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
        if (name === "react")
          return {
            useState: (initial: unknown) => [initial, () => {}],
            useEffect: () => {},
          };
        if (name === "@/hooks/useRobberyTrackerLastJoinedServer")
          return {
            useRobberyTrackerLastJoinedServer: () => ({
              lastJoined: null,
              setLastJoined: () => {},
            }),
          };
        if (name === "@/hooks/useServerRegions")
          return { useServerRegions: () => ({}) };
        if (name === "@/hooks/useSharedTimer")
          return { useOptimizedRealTimeRelativeDate: () => "" };
        if (name === "@/utils/analytics/web")
          return {
            trackWebEvent: (name: string, props: unknown) =>
              events.push({ name, props }),
          };
        if (name === "sonner") return { toast: { loading: () => 1 } };
        if (name === "./deepLink")
          return {
            buildRobloxServerDeepLink: (jobId: string) => `roblox://${jobId}`,
          };
        if (name === "./utils") return { formatServerTime: () => "12:00" };
        if (name === "@/lib/utils")
          return {
            cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
          };
        return new Proxy({}, { get: (_, key) => String(key) });
      },
    },
  );
  const render = (airdrop: AirdropData) =>
    nodes(
      exports.default({
        ...joinProps,
        airdrop,
        useExternalRegionData: true,
        onJoin: (report: TrackerJoinReport) => actions.push(report),
      }),
    );
  expect(events).toEqual([]);
  for (const airdrop of [hard, easy]) {
    const map = render(airdrop).find(
      (node) => node.props["data-rybbit-event"] === "View Airdrop Map",
    )!;
    (map.props.onClick as () => void)();
  }
  expect(events).toEqual(
    [hard, easy].map((airdrop) => ({
      name: "airdrop_map_open",
      props: { location: airdrop.location },
    })),
  );
  const join = render(hard).find(
    (node) => node.props["data-rybbit-prop-tracker"] === "Airdrop_Tracker",
  )!;
  (join.props.onClick as () => void)();
  expect(actions).toEqual([
    {
      server_id: "test-server",
      marker_name: "Airdrop:dunes:hard",
      display_name: "Dunes Airdrop",
      tracker_type: "robbery",
    },
    "roblox://test-server",
  ]);
  expect(
    render(easy).some(
      (node) => node.props["data-rybbit-prop-tracker"] === "Airdrop_Tracker",
    ),
  ).toBe(false);
});
