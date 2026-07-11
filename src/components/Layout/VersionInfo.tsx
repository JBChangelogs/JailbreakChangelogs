"use client";

import { createLogger } from "@/services/logger";
import { useState, useEffect } from "react";

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
  const [versionInfo, setVersionInfo] = useState<VersionInfoState | null>(
    initialData || null,
  );

  useEffect(() => {
    let ignore = false;

    const fetchVersion = async () => {
      try {
        const response = await fetch("/api/version");
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          log.error("fetch version info failed", {
            status: response.status,
            body,
          });
          throw new Error("Failed to fetch version info");
        }
        const data: VersionInfoState = await response.json();
        if (ignore) return;
        setVersionInfo(data);
      } catch (error) {
        if (ignore) return;
        log.error("Error fetching version info", error);
        const fallback: VersionInfoState = {
          version: "unknown",
          date: Date.now(),
          branch: "development",
          commitUrl: "#",
        };
        setVersionInfo(fallback);
      }
    };

    if (!versionInfo) {
      fetchVersion();
    }

    return () => {
      ignore = true;
    };
  }, [versionInfo]);

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
