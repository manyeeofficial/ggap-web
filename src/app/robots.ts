import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/onboarding', '/terms', '/privacy'],
        disallow: [
          '/register',
          '/forgot-password',
          '/camera',
          '/loading',
          '/analysis-result',
          '/history',
          '/my-skin',
          '/settings',
          '/profile-edit',
          '/skin-profile-edit',
          '/notification-settings',
          '/language-settings',
          '/contact',
          '/notices',
          '/auth/',
          '/mypage/',
        ],
      },
    ],
    sitemap: 'https://ggap.ai/sitemap.xml',
  }
}
