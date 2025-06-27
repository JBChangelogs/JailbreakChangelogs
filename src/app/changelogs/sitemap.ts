import type { MetadataRoute } from 'next'
import { PROD_API_URL } from '@/services/api'

const BASE_URL = 'https://jailbreakchangelogs.xyz'
const ASSETS_URL = 'https://assets.jailbreakchangelogs.xyz'

interface Changelog {
  id: number;
  title: string;
  image_url: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(`${PROD_API_URL}/changelogs/list`)
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