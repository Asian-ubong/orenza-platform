import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ORENZA',
    short_name: 'ORENZA',
    description: 'Smart Trading. Secure Future.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B192B',
    theme_color: '#2A402D',
    orientation: 'portrait',
    icons: [
      { src: '/brand/orenza-mark.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
    categories: ['finance', 'business'],
  };
}
