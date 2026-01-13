"use client";

import { useState, useEffect } from "react";
import { formatFullDate } from "@/utils/timestamp";
import RailwayBadge from "./RailwayBadge";

interface VersionInfoState {
  version: string;
  date: number;
  branch: string;
  commitUrl: string;
}

export default function VersionInfo() {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [versionInfo, setVersionInfo] = useState<VersionInfoState | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await fetch("/api/version");
        if (!response.ok) {
          throw new Error("Failed to fetch version info");
        }
        const data: VersionInfoState = await response.json();
        setVersionInfo(data);
        setFormattedDate(formatFullDate(data.date));
      } catch (error) {
        console.error("Error fetching version info:", error);
        const fallback: VersionInfoState = {
          version: "unknown",
          date: Date.now(),
          branch: "development",
          commitUrl: "#",
        };
        setVersionInfo(fallback);
        setFormattedDate(formatFullDate(fallback.date));
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className="text-secondary-text space-y-1 text-xs leading-relaxed">
      <p>
        Version:{" "}
        <a
          href={versionInfo?.commitUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
        >
          {versionInfo?.version ?? "Loading..."}
        </a>
      </p>
      <p>
        Environment:{" "}
        {versionInfo
          ? versionInfo.branch.charAt(0).toUpperCase() +
            versionInfo.branch.slice(1)
          : "Loading..."}
      </p>
      <p>Updated: {formattedDate || "Loading..."}</p>
      <div className="pt-1">
        <RailwayBadge />
      </div>
    </div>
  );
}
