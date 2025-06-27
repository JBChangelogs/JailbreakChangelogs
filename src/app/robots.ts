import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/*?page=',
          '/*?filter=',
          '/api/',
          '/cdn-cgi/',
        ],
      },
    ],
    sitemap: [
      'https://jailbreakchangelogs.xyz/sitemap.xml',
      'https://jailbreakchangelogs.xyz/changelogs/sitemap.xml',
      'https://jailbreakchangelogs.xyz/seasons/sitemap.xml',
      'https://jailbreakchangelogs.xyz/values/sitemap.xml',
    ],
  }
}