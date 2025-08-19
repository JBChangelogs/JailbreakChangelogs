import type { MetadataRoute } from 'next'
import { PUBLIC_API_URL } from '@/utils/api'

const BASE_URL = 'https://jailbreakchangelogs.xyz'
const ASSETS_URL = 'https://assets.jailbreakchangelogs.xyz'

interface Changelog {
  id: number;
  title: string;
  image_url: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  console.log(`[DEBUG CHANGELogs] Using PUBLIC_API_URL: ${PUBLIC_API_URL}`);
  console.log(`[DEBUG CHANGELogs] NEXT_PHASE: ${process.env.NEXT_PHASE}`);
  console.log(`[DEBUG CHANGELogs] RAILWAY_ENVIRONMENT_NAME: ${process.env.RAILWAY_ENVIRONMENT_NAME}`);
  
  const response = await fetch(`${PUBLIC_API_URL}/changelogs/list`)
  const data = await response.json()
  
  return data.map((changelog: Changelog) => {
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}/changelogs/${changelog.id}`,
      lastModified: new Date().toISOString(),
      priority: 0.7,
      changeFrequency: 'monthly',
    }

    // Changelog Thumbnails
    if (changelog.image_url) {
      entry.images = [`${ASSETS_URL}${changelog.image_url}`]
    }

    return entry
  })
} 