import type { MetadataRoute } from "next";
import { BASE_API_URL } from "@/utils/api";

const BASE_URL = "https://jailbreakchangelogs.xyz";

export const revalidate = 3600; // Revalidate every 1 hour

interface ChangelogGroup {
  id: number;
  change_count: number;
  created_at: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(`${BASE_API_URL}/items/changelogs/list`);
  const data: ChangelogGroup[] = await response.json();

  return data.map((changelog) => ({
    url: `${BASE_URL}/values/changelogs/${changelog.id}`,
    lastModified: new Date(changelog.created_at * 1000).toISOString(),
    priority: 0.7,
    changeFrequency: "monthly",
  }));
}
