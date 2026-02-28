import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://ggap.ai'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/settings',
          '/profile-edit',
          '/skin-profile-edit',
          '/analysis-loading',
          '/analysis-result',
          '/language-settings',
          '/notification-settings',
          '/contact',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
