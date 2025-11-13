"use client";

import { useState, useEffect } from "react";
import { formatFullDate } from "@/utils/helpers/timestamp";

interface VersionInfoProps {
  version: string;
  date: number;
  branch: string;
  commitUrl: string;
}

export default function VersionInfo({
  version,
  date,
  branch,
  commitUrl,
}: VersionInfoProps) {
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    // Format the date client-side to show in user's local timezone
    setFormattedDate(formatFullDate(date));
  }, [date]);

  return (
    <div className="text-secondary-text text-xs leading-relaxed space-y-1">
      <p>
        Version:{" "}
        <a
          href={commitUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link hover:text-link-hover active:text-link-active transition-colors duration-200 hover:underline"
        >
          {version}
        </a>
      </p>
      <p>Environment: {branch.charAt(0).toUpperCase() + branch.slice(1)}</p>
      <p>Updated: {formattedDate || "Loading..."}</p>
    </div>
  );
}
