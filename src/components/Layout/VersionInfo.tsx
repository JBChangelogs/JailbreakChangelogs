"use client";

import { useEffect, useState } from "react";
import { getWebsiteVersion } from "@/utils/version";

export default function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<{
    version: string;
    date: string;
  }>({
    version: "loading...",
    date: "loading...",
  });

  useEffect(() => {
    const fetchVersion = async () => {
      const info = await getWebsiteVersion();
      setVersionInfo(info);
    };
    fetchVersion();
  }, []);

  return (
    <>
      <p className="text-muted">Version: {versionInfo.version}</p>
      <p className="text-muted">Last Updated: {versionInfo.date}</p>
    </>
  );
}
