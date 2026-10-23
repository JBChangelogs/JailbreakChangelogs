import { expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AirdropData } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { getAirdropKey } from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import { filterAirdrops } from "./AirdropList";
import AirdropCard from "./AirdropCard";

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
      <AirdropCard airdrop={{ ...hard, color }} useExternalRegionData />,
    );
    expect(markup).toContain(label);
    expect(markup).toContain("Dunes Airdrop");
    expect(markup).toContain("Join");
    expect(markup).toContain("Location");
    expect(markup).toContain("Logged");
  }
  const markup = renderCard(
    <AirdropCard airdrop={easy} useExternalRegionData />,
  );
  expect(markup).toContain("Cactus Valley Airdrop");
  expect(markup).not.toContain("Join Server");
});
