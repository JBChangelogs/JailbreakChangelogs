"use client";

import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Layout/Breadcrumb";
import TimelineClient from "@/components/Timeline/TimelineClient";
import TimelineLoading from "@/app/changelogs/timeline/loading";
import { Changelog, PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";

export default function TimelinePage() {
  const [changelogs, setChangelogs] = useState<Changelog[] | null>(null);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }
        const apiBaseUrl = PUBLIC_API_URL;

        const response = await fetch(
          buildApiUrlWithDevToken(apiBaseUrl, "/changelogs"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch changelog list");
        }

        const data = (await response.json()) as Changelog[];
        const sorted = [...data].sort((a, b) => b.id - a.id);
        setChangelogs(sorted);
      } catch (error) {
        console.error("Error loading changelog timeline:", error);
        setChangelogs([]);
      }
    };

    void loadTimeline();
  }, []);

  if (!changelogs) {
    return <TimelineLoading />;
  }

  return (
    <main className="min-h-screen">
      <div className="container mx-auto">
        <Breadcrumb />
        <TimelineClient changelogs={changelogs} />
      </div>
    </main>
  );
}
