"use client";

import { useEffect, useState } from "react";
import { getWebsiteVersion } from "@/utils/version";

export default function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    date: string;
    branch: string;
  }>({
    version: "loading...",
    date: "loading...",
    branch: "loading...",
  });

  useEffect(() => {
    const fetchVersion = async () => {
      const info = await getWebsiteVersion();
      setVersionInfo(info);
    };
    fetchVersion();
  }, []);

  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 px-2 py-1 bg-secondary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">VER</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {versionInfo.version}
        </span>
      </div>

      <div className="inline-flex items-center gap-2 px-2 py-1 bg-secondary-bg rounded border border-border-primary">
        <span className="text-xs font-mono text-primary-text">UPD</span>
        <span className="text-xs font-mono font-semibold text-tertiary-text">
          {versionInfo.date}
        </span>
      </div>

      {versionInfo.branch !== "main" && (
        <div className="inline-flex items-center gap-2 px-2 py-1 bg-secondary-bg rounded border border-border-primary">
          <span className="text-xs font-mono text-primary-text">ENV</span>
          <span className="text-xs font-mono font-semibold text-tertiary-text uppercase">
            {versionInfo.branch}
          </span>
        </div>
      )}
    </div>
  );
}
