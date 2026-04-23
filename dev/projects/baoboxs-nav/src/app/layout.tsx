import { AuthProvider } from '@/contexts/AuthContext';
import { FrequentToolsSyncProvider } from '@/contexts/FrequentToolsSyncContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingButtons from '@/components/FloatingButtons';
import dynamic from 'next/dynamic';
import './globals.css';
import type { Metadata, Viewport } from 'next';

// 动态导入开发者保护组件，避免服务器/客户端组件混用问题
const DevToolsProtection = dynamic(
  () => import('@/components/DevToolsProtection').then(mod => mod.DevToolsProtection)
);

export const metadata: Metadata = {
  title: '程序员宝盒 - 开发者常用导航大全 - 一站式效率提升平台',
  description: '一个不断增长的提效工具资源库，包含AI、工作、娱乐、学习、提效、常用工具、软件推荐等等，一个为开发者提供常用工具导航的平台，帮助开发者提高工作效率。',
};

// 优化移动端视口配置，特别针对iOS Safari
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // 允许用户缩放，提高可访问性
  minimumScale: 1,
  userScalable: true, // iOS Safari 建议允许缩放
  viewportFit: 'cover', // iOS Safari 安全区域适配
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2e3f4b' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* iOS Safari 优化的viewport配置 */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

        {/* iOS Safari 特定优化 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="程序员宝盒" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* 禁用iOS Safari的自动识别 */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

        {/* iOS Safari 缓存优化 */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />

        {/* iOS Safari 渲染优化 */}
        <meta name="renderer" content="webkit" />
        <meta name="force-rendering" content="webkit" />

        {/* 百度统计 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            var _hmt = _hmt || [];
            (function() {
              var hm = document.createElement("script");
              hm.src = "https://hm.baidu.com/hm.js?ec63cb7d563110527c5bb0080dc96a55";
              var s = document.getElementsByTagName("script")[0]; 
              s.parentNode.insertBefore(hm, s);
            })();
          `
        }} />

        {/* 确保CSS正确加载 */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* iOS Safari 紧急样式修复 */
            html {
              -webkit-text-size-adjust: 100%;
              text-size-adjust: 100%;
            }
            body {
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              margin: 0;
              padding: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-box-sizing: border-box;
            }
          `
        }} />
      </head>
      <body>
        {/* 开发者工具保护 - 仅生产环境生效 */}
        <DevToolsProtection />

        <AuthProvider>
          <FrequentToolsSyncProvider>
          {/* iOS Safari 安全区域适配容器 */}
          <div className="min-h-screen flex flex-col bg-gray-100" style={{
            minHeight: '-webkit-fill-available'
          }}>
            {/* 固定顶部导航 - iOS Safari 优化 */}
            <div className="fixed top-0 left-0 right-0 z-30" style={{
              paddingTop: 'env(safe-area-inset-top, 0)'
            }}>
              <Header />
            </div>

            {/* 主内容区域 - iOS Safari 优化 */}
            <div className="flex flex-1 relative" style={{
              paddingTop: 'calc(5rem + env(safe-area-inset-top, 0))',
              paddingLeft: 'env(safe-area-inset-left, 0)',
              paddingRight: 'env(safe-area-inset-right, 0)',
              paddingBottom: 'env(safe-area-inset-bottom, 0)'
            }}>
              {/* 主内容区域 */}
              <div className="flex-1 flex flex-col mx-2 sm:mx-4 md:mx-6 lg:mx-8">
                <main className="flex-1 overflow-y-auto" style={{
                  WebkitOverflowScrolling: 'touch'
                }}>
                  {children}
                </main>
              </div>
              <FloatingButtons />
            </div>


          </div>
          </FrequentToolsSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
