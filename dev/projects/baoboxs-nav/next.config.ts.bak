import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用standalone模式，用于Docker部署
  output: 'standalone',

  // 自定义webpack配置
  webpack: (config, { dev, isServer }) => {
    // 只在生产环境构建时去除console.log
    if (!dev && !isServer) {
      // 直接重写optimization.minimizer配置
      const TerserPlugin = require('terser-webpack-plugin');

      // 创建新的TerserPlugin实例，确保drop_console配置生效
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
            },
            mangle: true, // 变量名混淆
            format: {
              comments: false, // 移除注释
            },
          },
          extractComments: false, // 不提取注释到单独文件
          parallel: true, // 并行处理
        }),
      ];
    }

    return config;
  },

  // 基本性能优化
  compress: true, // 开启gzip压缩
  poweredByHeader: false, // 移除 X-Powered-By 头

  // 支持服务端运行时环境变量
  serverRuntimeConfig: {
    // 这些变量只在服务端可用
    apiEnv: process.env.API_ENV || 'production',
  },

  // 支持公共运行时环境变量（客户端和服务端都可用）
  publicRuntimeConfig: {
    // 这些变量在客户端和服务端都可用
    apiEnv: process.env.API_ENV || 'production',
  },

  // ESLint配置
  eslint: {
    ignoreDuringBuilds: true, // 构建时忽略ESLint错误
  },

  // 图片优化配置
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 1天缓存
  },

  // 实验性功能
  experimental: {
    // 优化包导入
    optimizePackageImports: ['react-icons', 'clsx', 'tailwind-merge'],
    // Turbopack相关配置
    turbo: {
      // 当使用Turbopack时的配置
      // 注意：Turbopack目前不支持.babelrc，只能在生产构建时通过webpack移除console.log
    },
  },

  // HTTP头配置
  async headers() {
    return [
      // 静态资源缓存
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API缓存配置
      {
        source: '/api/utility/proxy/tools',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=300', // 5分钟缓存，5分钟过期
            //value: 'public, s-maxage=300, stale-while-revalidate=3600', // 5分钟缓存，1小时过期
            //value: 'public, max-age=300, s-maxage=300', // 5分钟后强制重新请求
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=300',
          },
        ],
      },
      {
        source: '/api/utility/proxy/city',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=172800', // 1天缓存，2天过期
          },
          {
            key: 'CDN-Cache-Control',
            value: 'max-age=86400',
          },
        ],
      },
      // 安全头
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // URL重写 - 用户看到的URL不变，但实际渲染不同的页面
  async rewrites() {
    return [
      // 固定的访问地址映射到实际的文件路径
      {
        source: '/bookmarks/:path*',
        destination: '/features/bookmarks/:path*',
      },
      {
        source: '/favorites/:path*',
        destination: '/features/favorites/:path*',
      },
      {
        source: '/moyu/:path*',
        destination: '/features/moyu/:path*',
      },
      {
        source: '/tutorials/:path*',
        destination: '/content/tutorials/:path*',
      },
      {
        source: '/resources/:path*',
        destination: '/content/resources/:path*',
      },
      {
        source: '/privacy',
        destination: '/pages/privacy',
      },
      {
        source: '/agreement',
        destination: '/pages/agreement',
      },
      {
        source: '/v5/:path*',
        destination: '/versions/v5/:path*',
      },
      {
        source: '/tools/json-formatter',
        destination: '/tools/development/json-formatter',
      },
    ];
  },

  async redirects() {
    return [
      // 保留一些重定向用于向后兼容
      {
        source: '/features/tools/:path*',
        destination: '/tools/:path*',
        permanent: true,
      },
      {
        source: '/system/api/:path*',
        destination: '/api/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
