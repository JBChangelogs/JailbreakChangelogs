"use client";

import { useState, useEffect } from "react";
import { formatFullDate } from "@/utils/timestamp";

interface VersionInfoProps {
  version: string;
  date: number;
  branch: string;
}

export default function VersionInfo({
  version,
  date,
  branch,
}: VersionInfoProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format the date client-side to show in user's local timezone
    setFormattedDate(formatFullDate(date));
  }, [date]);

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">VER</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {version}
        </span>
        <span className="text-xs font-mono text-primary-text">•</span>
        <span className="text-xs font-mono text-primary-text">ENV</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text uppercase">
          {branch}
        </span>
      </div>

      <div className="inline-flex items-center gap-2 px-2 py-1 bg-primary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">UPD</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {formattedDate || "Loading..."}
        </span>
      </div>
    </div>
  );
}
