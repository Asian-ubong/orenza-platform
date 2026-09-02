import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AURENZA BROKER',
    short_name: 'AURENZA',
    description: 'Private trading, real-world market data, sandbox and provider workspace.',
    start_url: '/private-access',
    display: 'standalone',
    background_color: '#FAF9F6',
    theme_color: '#2A402D',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    categories: ['finance', 'business'],
  };
}
