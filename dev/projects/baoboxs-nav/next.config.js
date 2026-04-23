/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用standalone模式，用于Docker部署
  output: 'standalone',

  // 自定义webpack配置
  webpack: (config, { dev, isServer }) => {
    // 只在生产环境构建时去除console.log
    if (!dev && !isServer) {
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
            mangle: true,
            format: {
              comments: false,
            },
          },
          extractComments: false,
          parallel: true,
        }),
      ];
    }
    return config;
  },

  compress: true,
  poweredByHeader: false,

  serverRuntimeConfig: {
    apiEnv: process.env.API_ENV || 'production',
  },

  publicRuntimeConfig: {
    apiEnv: process.env.API_ENV || 'production',
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400,
  },

  experimental: {
    optimizePackageImports: ['react-icons', 'clsx', 'tailwind-merge'],
    turbo: {},
  },

  async headers() {
    return [
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/api/utility/proxy/tools',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=300' },
          { key: 'CDN-Cache-Control', value: 'max-age=300' },
        ],
      },
      {
        source: '/api/utility/proxy/city',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=172800' },
          { key: 'CDN-Cache-Control', value: 'max-age=86400' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      { source: '/bookmarks/:path*', destination: '/features/bookmarks/:path*' },
      { source: '/favorites/:path*', destination: '/features/favorites/:path*' },
      { source: '/moyu/:path*', destination: '/features/moyu/:path*' },
      { source: '/tutorials/:path*', destination: '/content/tutorials/:path*' },
      { source: '/resources/:path*', destination: '/content/resources/:path*' },
      { source: '/privacy', destination: '/pages/privacy' },
      { source: '/agreement', destination: '/pages/agreement' },
      { source: '/v5/:path*', destination: '/versions/v5/:path*' },
      { source: '/tools/json-formatter', destination: '/tools/development/json-formatter' },
    ];
  },

  async redirects() {
    return [
      { source: '/features/tools/:path*', destination: '/tools/:path*', permanent: true },
      { source: '/system/api/:path*', destination: '/api/:path*', permanent: true },
    ];
  },
};

module.exports = nextConfig;