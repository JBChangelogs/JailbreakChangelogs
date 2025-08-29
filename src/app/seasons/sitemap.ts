import type { MetadataRoute } from 'next'
import { fetchSeasonsList, Season, Reward } from '@/utils/api'

const BASE_URL = 'https://jailbreakchangelogs.xyz'
const ASSETS_URL = 'https://assets.jailbreakchangelogs.xyz'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await fetchSeasonsList()
  
  return data
    .filter((season: Season) => 
      Array.isArray(season.rewards) && season.rewards.length > 0
    )
    .map((season: Season) => {
      const entry: MetadataRoute.Sitemap[number] = {
        url: `${BASE_URL}/seasons/${season.season}`,
        lastModified: new Date().toISOString(),
        priority: 0.7,
        changeFrequency: 'monthly',
      }

      // Find the level 10 reward
      const level10Reward = season.rewards.find(
        (reward: Reward) => 
          reward.requirement === "Level 10" && 
          reward.link !== "N/A" && 
          reward.link !== null
      )

      // Add level 10 reward image if available
      if (level10Reward?.link) {
        entry.images = [`${ASSETS_URL}${level10Reward.link}`]
      }

      return entry
    })
} 