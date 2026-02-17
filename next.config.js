/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable SWC compiler for faster builds
  swcMinify: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
    ],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // Experimental features for better performance
  experimental: {
    // Better tree shaking
    esmExternals: true,
    // Optimize imports for faster dev compilation
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-popover',
      '@radix-ui/react-alert-dialog',
      '@tanstack/react-query',
      'framer-motion',
      'recharts',
      'date-fns',
    ],
  },

  // Bundle analyzer - uncomment to analyze bundle size
  // Run with: ANALYZE=true npm run build
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(
        new (require('@next/bundle-analyzer'))({
          enabled: process.env.ANALYZE === 'true',
        })
      );
      return config;
    },
  }),
}

module.exports = nextConfig