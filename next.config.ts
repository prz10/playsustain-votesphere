import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
      },
      // Allow images from Unsplash - testing purpose
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Play Sustain - external API for project imports
      {
        protocol: 'https',
        hostname: 'playsustain.pl',
      },
    ],
  },

  // Environment variables available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'VoteSphere',
  },
};

export default withNextIntl(nextConfig);
