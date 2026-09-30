"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

const log = createLogger("UI");
import { formatFullDate } from "@/utils/helpers/timestamp";
import RailwayBadge from "./RailwayBadge";

export interface VersionInfoState {
  version: string;
  date: number;
  branch: string;
  commitUrl: string;
}

interface VersionInfoProps {
  initialData?: VersionInfoState;
}

export default function VersionInfo({ initialData }: VersionInfoProps = {}) {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [fallback] = useState<VersionInfoState>(() => ({
    version: "unknown",
    date: Date.now(),
    branch: "development",
    commitUrl: "#",
  }));
  const versionQuery = useQuery({
    queryKey: ["version-info"],
    queryFn: async ({ signal }): Promise<VersionInfoState> => {
      try {
        const response = await fetch("/api/version", { signal });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          log.error("fetch version info failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch version info");
        }
        return response.json() as Promise<VersionInfoState>;
      } catch (error) {
        log.error("Error fetching version info", error);
        throw error;
      }
    },
    initialData,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
  const versionInfo =
    versionQuery.data ?? (versionQuery.isError ? fallback : null);

  // Handle date formatting on client only to avoid hydration mismatch
  // and ensure local timezone display
  useEffect(() => {
    if (versionInfo?.date) {
      setFormattedDate(formatFullDate(versionInfo.date));
    }
  }, [versionInfo?.date]);

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
