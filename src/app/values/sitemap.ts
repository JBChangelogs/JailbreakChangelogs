import type { MetadataRoute } from 'next'
import { PROD_API_URL } from '@/services/api'
import { getItemImagePath, isVideoItem, getVideoThumbnailPath, getVideoPath } from '@/utils/images'

const BASE_URL = 'https://jailbreakchangelogs.xyz'

interface Item {
  name: string;
  type: string;
  last_updated: number | null;
  image_url?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(`${PROD_API_URL}/items/list`, {
    next: { revalidate: 3600 } // Cache for 1 hour
  })
  const data = await response.json()
  
  return data.map((item: Item) => {
    // Use current timestamp if last_updated is null, otherwise normalize the timestamp
    const timestamp = item.last_updated === null 
      ? Date.now()
      : item.last_updated < 10000000000 
        ? item.last_updated * 1000 
        : item.last_updated
    
    const entry: MetadataRoute.Sitemap[number] = {
      url: `${BASE_URL}/item/${encodeURIComponent(item.type)}/${encodeURIComponent(item.name)}`,
      lastModified: new Date(timestamp).toISOString(),
      priority: 0.8,
      changeFrequency: 'daily',
    }

    if (isVideoItem(item.name)) {
      // For video items, we use the video sitemap format
      entry.videos = [{
        title: `${item.name} - ${item.type}`,
        thumbnail_loc: getVideoThumbnailPath(item.type, item.name),
        description: `${item.name} - ${item.type} in Roblox Jailbreak`,
        content_loc: getVideoPath(item.type, item.name),
      }]
    } else {
      // For regular items, use the image sitemap format
      const imageUrl = getItemImagePath(item.type, item.name, true)
      if (imageUrl) {
        entry.images = [imageUrl]
      }
    }

    return entry
  })
} 