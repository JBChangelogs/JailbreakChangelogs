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
      <p className="text-primary-text">
        Version:{" "}
        <span className="text-secondary-text">{versionInfo.version}</span>
      </p>
      <p className="text-primary-text">
        Last Updated:{" "}
        <span className="text-secondary-text">{versionInfo.date}</span>
      </p>
    </>
  );
}
