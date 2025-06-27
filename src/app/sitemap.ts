import type { MetadataRoute } from 'next'

const BASE_URL = 'https://jailbreakchangelogs.xyz'

export default function sitemap(): MetadataRoute.Sitemap {
  // Static pages that don't need their own sitemap
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date().toISOString(),
      priority: 1.0,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/values`,
      lastModified: new Date().toISOString(),
      priority: 0.9,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date().toISOString(),
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date().toISOString(),
      priority: 0.3,
      changeFrequency: 'yearly' as const,
    },
    {
      url: `${BASE_URL}/tos`,
      lastModified: new Date().toISOString(),
      priority: 0.3,
      changeFrequency: 'yearly' as const,
    },
    {
      url: `${BASE_URL}/contributors`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'weekly' as const,
    },
    {
      url: `${BASE_URL}/redeem`,
      lastModified: new Date().toISOString(),
      priority: 0.7,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/supporting`,
      lastModified: new Date().toISOString(),
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    },
    {
      url: `${BASE_URL}/servers`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/timeline`,
      lastModified: new Date().toISOString(),
      priority: 0.7,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/bot`,
      lastModified: new Date().toISOString(),
      priority: 0.5,
      changeFrequency: 'monthly' as const,
    },
    {
      url: `${BASE_URL}/dupes`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/settings`,
      lastModified: new Date().toISOString(),
      priority: 0.4,
      changeFrequency: 'monthly' as const,
    },
    {
      url: `${BASE_URL}/trading`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/users`,
      lastModified: new Date().toISOString(),
      priority: 0.7,
      changeFrequency: 'daily' as const,
    },
  ]

  // Sitemap URLs for each content type
  const sitemapUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/changelogs/sitemap.xml`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/seasons/sitemap.xml`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
    {
      url: `${BASE_URL}/values/sitemap.xml`,
      lastModified: new Date().toISOString(),
      priority: 0.8,
      changeFrequency: 'daily' as const,
    },
  ]

  return [...staticPages, ...sitemapUrls]
} 