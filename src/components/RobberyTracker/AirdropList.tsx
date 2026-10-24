"use client";

import { useMemo, useState } from "react";
import {
  getAirdropKey,
  type AirdropData,
} from "@/hooks/useRobberyTrackerAirdropsWebSocket";
import type { ServerRegionData } from "@/hooks/useRobberyTrackerWebSocket";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AirdropCard from "./AirdropCard";

export function filterAirdrops(
  airdrops: AirdropData[],
  location: string,
  color: string,
  searchQuery: string,
  serverSize: "all" | "big" | "small",
  timeSort: "newest" | "oldest",
) {
  const query = searchQuery.trim().toLowerCase();
  return airdrops
    .filter((airdrop) => {
      const playerCount = airdrop.server?.players?.length ?? 0;
      return (
        (location === "all" || airdrop.location === location) &&
        (color === "all" || airdrop.color === color) &&
        (serverSize === "all" ||
          (serverSize === "big" ? playerCount >= 9 : playerCount < 9)) &&
        `${airdrop.location} ${airdrop.location.replace(/([A-Z])/g, " $1")} ${airdrop.color}`
          .toLowerCase()
          .includes(query)
      );
    })
    .sort((a, b) =>
      timeSort === "newest"
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp,
    );
}

export default function AirdropList({
  airdrops,
  searchQuery,
  serverSize,
  timeSort,
  serverRegions,
}: {
  airdrops: AirdropData[];
  searchQuery: string;
  serverSize: "all" | "big" | "small";
  timeSort: "newest" | "oldest";
  serverRegions: Record<string, ServerRegionData | null>;
}) {
  const [location, setLocation] = useState("all");
  const [color, setColor] = useState("all");
  const filtered = useMemo(
    () =>
      filterAirdrops(
        airdrops,
        location,
        color,
        searchQuery,
        serverSize,
        timeSort,
      ),
    [airdrops, location, color, searchQuery, serverSize, timeSort],
  );

  return (
    <>
      <Tabs value={location} onValueChange={setLocation} className="mb-4">
        <TabsList fullWidth aria-label="Airdrop location">
          <TabsTrigger value="all" fullWidth>
            All Locations
          </TabsTrigger>
          <TabsTrigger value="CactusValley" fullWidth>
            Cactus Valley
          </TabsTrigger>
          <TabsTrigger value="Dunes" fullWidth>
            Dunes
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div
        role="group"
        aria-label="Airdrop difficulty"
        className="mb-4 flex flex-wrap gap-2"
      >
        {[
          ["all", "All Difficulties"],
          ["Brown", "Easy"],
          ["Blue", "Medium"],
          ["Red", "Hard"],
        ].map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={color === value ? "default" : "secondary"}
            aria-pressed={color === value}
            onClick={() => setColor(value)}
          >
            {label}
          </Button>
        ))}
      </div>
      <p className="text-secondary-text mb-4 text-sm">
        Showing {filtered.length} of {airdrops.length} airdrops
        {` · ${filtered.filter((a) => a.color === "Brown").length} Easy · ${filtered.filter((a) => a.color === "Blue").length} Medium · ${filtered.filter((a) => a.color === "Red").length} Hard`}
      </p>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((airdrop) => (
            <AirdropCard
              key={getAirdropKey(airdrop)}
              airdrop={airdrop}
              regionData={serverRegions[airdrop.server?.job_id ?? ""]}
              useExternalRegionData
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <h2 className="text-primary-text text-lg font-medium">
            {airdrops.length > 0
              ? "No airdrops match your filters"
              : "No airdrops tracked yet"}
          </h2>
          <p className="text-secondary-text">
            {airdrops.length > 0
              ? "Try adjusting your search or filters"
              : "Waiting for airdrop data..."}
          </p>
        </div>
      )}
    </>
  );
}
