import { expect, spyOn, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import type { RobberyData } from "@/hooks/useRobberyTrackerWebSocket";
import { safeSessionStorage } from "@/utils/storage/safeStorage";
import RobberyCard from "./RobberyCard";
import RobberyComboCard from "./RobberyComboCard";
import RobberyServerGroupCard from "./RobberyServerGroupCard";

const robbery: RobberyData = {
  marker_name: "Casino",
  name: "Crown Jewel",
  status: 2,
  progress: null,
  metadata: { casino_time: 1061 },
  job_id: "test-server",
  server_time: 12,
  timestamp: 990,
};

const cardProps = {
  joinedUsers: [],
  onJoin: () => {},
  useExternalRegionData: true,
};

function renderCard(card: ReactNode) {
  return renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      {card}
    </QueryClientProvider>,
  );
}

test("casino countdown appears only while a casino robbery is in progress", () => {
  const clock = spyOn(Date, "now").mockReturnValue(1_000_000);
  try {
    const render = (changes: Partial<RobberyData>) =>
      renderCard(
        <RobberyCard {...cardProps} robbery={{ ...robbery, ...changes }} />,
      );

    expect(render({})).toContain("Closes in");
    expect(render({})).toContain("1m 1s");
    expect(render({ metadata: { casino_time: 939 } })).toContain("0s");
    expect(render({ status: 1 })).not.toContain("Closes in");
    expect(render({ metadata: null })).not.toContain("Closes in");
    expect(render({ marker_name: "Museum" })).not.toContain("Closes in");
  } finally {
    clock.mockRestore();
  }
});

test("plane cards immediately show departure times and remove them when inactive", () => {
  const clock = spyOn(Date, "now").mockReturnValue(1_000_000);
  const plane = {
    ...robbery,
    marker_name: "CargoPlane",
    status: 1,
    metadata: { plane_time: 1061 },
  };
  try {
    expect(
      renderCard(<RobberyCard {...cardProps} robbery={plane} />),
    ).toContain("Departs in 1m 1s");
    expect(
      renderCard(
        <RobberyCard
          {...cardProps}
          robbery={{ ...plane, metadata: { plane_time: 939 } }}
        />,
      ),
    ).toContain("Departed 1m 1s ago");
    expect(
      renderCard(
        <RobberyCard {...cardProps} robbery={{ ...plane, status: 2 }} />,
      ),
    ).not.toContain("Departs in");
    expect(
      renderCard(
        <RobberyCard {...cardProps} robbery={{ ...plane, metadata: null }} />,
      ),
    ).not.toContain("Departs in");
  } finally {
    clock.mockRestore();
  }
});

test("all card views show last joined time only for the matching server", () => {
  const storage = spyOn(safeSessionStorage, "getItem");
  const views = [
    <RobberyCard key="individual" {...cardProps} robbery={robbery} />,
    <RobberyComboCard
      key="combo"
      {...cardProps}
      comboId="museum-power"
      comboLabel="Museum + Power"
      serverId={robbery.job_id}
      robberies={[robbery]}
    />,
    <RobberyServerGroupCard
      key="grouped"
      {...cardProps}
      serverId={robbery.job_id}
      robberies={[robbery]}
    />,
  ];
  try {
    for (const serverId of [robbery.job_id, "another-server"]) {
      storage.mockImplementation((key) =>
        key === "robberyTrackerLastJoinedTarget"
          ? JSON.stringify({
              kind: "robbery",
              jobId: serverId,
              markerName: "Casino",
              joinedAt: 990,
            })
          : null,
      );
      for (const view of views) {
        const markup = renderCard(view);
        expect(markup).toContain("Logged");
        expect(markup.includes("Last joined")).toBe(
          serverId === robbery.job_id,
        );
      }
    }
  } finally {
    storage.mockRestore();
  }
});
