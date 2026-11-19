import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as utils from "./utils";

type Node = { type: unknown; props: Record<string, unknown> };

function nodes(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object" || !("props" in value)) return [];
  const node = value as Node;
  return [node, ...nodes(node.props.children)];
}

for (const name of [
  "RobberyCard",
  "RobberyComboCard",
  "RobberyServerGroupCard",
  "ServerBountyGroup",
  "AirdropCard",
]) {
  test(`${name} shows the last joined badge immediately while its button is joining`, () => {
    const state: unknown[] = [];
    let cursor = 0;
    let lastJoined: unknown = null;
    const jsx = (type: unknown, props: Node["props"]) => ({ type, props });
    const exports = {} as { default: (props: object) => Node };
    runInNewContext(
      transpileModule(
        readFileSync(new URL(`./${name}.tsx`, import.meta.url), "utf8"),
        {
          compilerOptions: {
            module: ModuleKind.CommonJS,
            jsx: JsxEmit.ReactJSX,
          },
        },
      ).outputText,
      {
        exports,
        window: { setTimeout: () => 1, location: { assign: () => {} } },
        require: (id: string) => {
          if (id === "react/jsx-runtime") return { jsx, jsxs: jsx };
          if (id === "react")
            return {
              memo: (component: unknown) => component,
              useState: (initial: unknown) => {
                const index = cursor++;
                if (!(index in state)) state[index] = initial;
                return [
                  state[index],
                  (value: unknown) => {
                    state[index] = value;
                  },
                ];
              },
              useEffect: () => {},
              useMemo: (callback: () => unknown) => callback(),
              useCallback: (callback: unknown) => callback,
            };
          if (id === "./utils") return utils;
          if (id === "@/services/logger") return { createLogger: () => ({}) };
          if (id === "@/hooks/useServerRegions")
            return { useServerRegions: () => ({}) };
          if (id === "@/hooks/useSharedTimer")
            return { useOptimizedRealTimeRelativeDate: () => "Just now" };
          if (id === "@/hooks/useRobberyTrackerLastJoinedServer")
            return {
              useRobberyTrackerLastJoinedServer: () => ({
                lastJoined,
                setLastJoined: (value: unknown) => {
                  lastJoined = value;
                },
              }),
            };
          if (id === "sonner") return { toast: { loading: () => 1 } };
          if (id === "./deepLink")
            return { buildRobloxServerDeepLink: () => "roblox://test-server" };
          if (id === "@/lib/utils")
            return {
              cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
            };
          return new Proxy({}, { get: (_, key) => String(key) });
        },
      },
    );
    const entry = {
      job_id: "test-server",
      server: { job_id: "test-server", players: [] },
      marker_name: "Museum",
      name: "Museum",
      status: 1,
      timestamp: 100,
      bounty: 1000,
      location: "Crater",
      color: "Red",
    };
    const render = () => {
      cursor = 0;
      return nodes(
        exports.default({
          robbery: entry,
          robberies: [entry],
          bounties: [entry],
          airdrop: entry,
          serverId: entry.job_id,
          comboId: "museum-power",
          comboLabel: "Museum + Power",
          joinedUsers: [],
          onJoin: () => {},
          useExternalRegionData: true,
        }),
      );
    };
    const before = render();
    expect(
      before.some((node) =>
        JSON.stringify(node.props.children)?.includes("Last joined"),
      ),
    ).toBe(false);
    const button = before.find(
      (node) => node.props["data-rybbit-event"] === "Join Server",
    )!;
    (button.props.onClick as () => void)();
    const after = render();
    expect(
      after.find((node) => node.props["data-rybbit-event"] === "Join Server")
        ?.props.disabled,
    ).toBe(true);
    expect(
      after.some((node) =>
        JSON.stringify(node.props.children)?.includes("Last joined"),
      ),
    ).toBe(true);
  });
}
