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
    categories: ['finance', 'business'],
  };
}
