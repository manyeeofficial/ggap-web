import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/onboarding', '/terms', '/privacy'],
        disallow: [
          '/login',
          '/register',
          '/forgot-password',
          '/camera',
          '/analysis-loading',
          '/analysis-result',
          '/history',
          '/my-skin',
          '/settings',
          '/profile-edit',
          '/skin-profile-edit',
          '/notification-settings',
          '/language-settings',
          '/faq',
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
