import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: 'https://suimpp.dev',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://suimpp.dev/spec',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://suimpp.dev/docs',
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
