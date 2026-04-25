"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PUBLIC_API_URL } from "@/utils/api";
import { buildApiUrlWithDevToken } from "@/utils/apiDevToken";

export default function SeasonsPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLatest = async () => {
      try {
        if (!PUBLIC_API_URL) {
          throw new Error("Missing PUBLIC_API_URL");
        }

        const response = await fetch(
          buildApiUrlWithDevToken(PUBLIC_API_URL, "/seasons/latest"),
          {
            credentials: "include",
            headers: {
              "User-Agent": "JailbreakChangelogs-Seasons/1.0",
            },
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch latest season");
        }

        const latestSeason = await response.json();
        router.replace(`/seasons/${latestSeason.season}`);
      } catch (error) {
        console.error("Error fetching latest season:", error);
        router.replace("/seasons/31");
      }
    };

    void redirectToLatest();
  }, [router]);

  return null;
}
