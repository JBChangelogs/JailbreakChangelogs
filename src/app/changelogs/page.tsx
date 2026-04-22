"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";

export default function ChangelogsPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }

        const response = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL, "/changelogs/latest"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Changelogs/1.0",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch latest changelog");
        }

        const latestChangelog = await response.json();
        router.replace(`/changelogs/${latestChangelog.id}`);
      } catch (error) {
        console.error("Error fetching latest changelog:", error);
        router.replace("/changelogs/timeline");
      }
    };

    void redirectToLatest();
  }, [router]);

  return null;
}
