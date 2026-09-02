import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ORENZA Private Platform',
    short_name: 'ORENZA',
    description: 'Private trading, market analysis, sandbox capital and wallet workspace.',
    start_url: '/private-access',
    display: 'standalone',
    background_color: '#071016',
    theme_color: '#071016',
    orientation: 'portrait',
    categories: ['finance', 'business'],
  };
}
