"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import WeatherWidget from './Header/WeatherWidget';
import SearchWidget from './Header/SearchWidget';
import UserMenu from './Header/UserMenu';

const Header: React.FC = () => {
  const [showBookmarkTip, setShowBookmarkTip] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 获取当前路径
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 判断链接是否激活的函数
  const isActive = (path: string) => {
    if (!pathname) return false;
    
    if (path === '/' && pathname === '/') return true;
    if (path !== '/') {
      // 首先检查原始路径
      if (pathname.startsWith(path)) return true;
      
      // 处理 rewrites 映射 - 检查重写后的路径是否匹配
      const rewriteMap: Record<string, string> = {
        '/bookmarks': '/features/bookmarks',
        '/favorites': '/features/favorites', 
        '/moyu': '/features/moyu',
        '/tutorials': '/content/tutorials',
        '/resources': '/content/resources',
      };
      
      const rewrittenPath = rewriteMap[path];
      if (rewrittenPath && pathname.startsWith(rewrittenPath)) {
        return true;
      }
    }
    return false;
  };

  // 处理页面加载状态
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (document.readyState === 'complete') {
      setPageLoaded(true);
    } else {
      const handleLoad = () => {
        console.log('页面加载完成');
        setPageLoaded(true);
      };

      window.addEventListener('load', handleLoad);

      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-[#2e3f4b] text-white p-4">
      <div className="container mx-auto">
        {/* 主导航栏 */}
        <div className="flex items-center justify-between">
          {/* 左侧：Logo + 主导航 */}
          <div className="flex items-center flex-1">
            {/* Logo */}
            <div className="mr-4 flex-shrink-0">
              <Link href="/">
                <Image
                  src="/icons/cxybb_logo.png"
                  alt="程序员宝盒"
                  width={253}
                  height={88}
                  className="h-auto w-auto max-h-12 md:max-h-16 cursor-pointer"
                  priority
                />
              </Link>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden md:flex items-center space-x-4 whitespace-nowrap">
              <Link
                href="/"
                className={`px-2 py-1 rounded text-sm menu-transition menu-item ${isActive('/') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                首页
              </Link>
              <Link
                href="/bookmarks"
                className={`px-2 py-1 rounded text-sm menu-transition menu-item ${isActive('/bookmarks') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                书签
              </Link>
              <Link
                href="/favorites"
                className={`px-2 py-1 rounded text-sm menu-transition menu-item ${isActive('/favorites') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                收藏
              </Link>
              <Link
                href="/moyu"
                className={`px-2 py-1 rounded text-sm menu-transition menu-item ${isActive('/moyu') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                摸鱼
              </Link>

              <Link
                href="/tools"
                className={`hidden px-2 py-1 rounded text-sm ${isActive('/tools') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                工具
              </Link>
              <Link
                href="/content/tutorials"
                className={`hidden px-2 py-1 rounded text-sm ${isActive('/content/tutorials') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                教程
              </Link>
              <Link
                href="/content/resources"
                className={`hidden px-2 py-1 rounded text-sm ${isActive('/content/resources') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
              >
                资源
              </Link>

              {/* 收藏网站按钮 */}
              <div
                className="hidden lg:inline-block relative group ml-2"
                onMouseEnter={() => setShowBookmarkTip(true)}
                onMouseLeave={() => setShowBookmarkTip(false)}
              >
                <button
                  className="bg-teal-500 hover:bg-teal-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm transition-transform group-hover:scale-110"
                  aria-label="收藏网站"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>

                {/* 收藏提示框 */}
                {showBookmarkTip && (
                  <div className="absolute right-0 top-9 w-64 bg-white text-gray-800 rounded-lg shadow-lg p-4 z-50 transition-all duration-200 opacity-100 scale-100">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-teal-500 mr-3">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">添加到收藏夹</h4>
                        <p className="text-xs text-gray-600">
                          请使用 {isClient && typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac') ? '⌘+D' : 'Ctrl+D'} 将本页添加到收藏夹
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* 中间：搜索组件 */}
          <div className="hidden xl:block flex-1 max-w-xl mx-4">
            <SearchWidget />
          </div>

          {/* 右侧：天气 + 用户菜单 + 移动端菜单按钮 */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 天气信息 - 只在大屏幕显示 */}
            <div className="hidden lg:block">
              <WeatherWidget />
            </div>

            {/* 用户登录/头像区域 */}
            <UserMenu />

            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-700"
              onClick={toggleMobileMenu}
              aria-label="移动端菜单"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-600">
            <nav className="flex flex-col space-y-2 pt-4">
              <Link
                href="/"
                className={`px-3 py-2 rounded text-sm menu-transition menu-item ${isActive('/') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                首页
              </Link>
              <Link
                href="/bookmarks"
                className={`px-3 py-2 rounded text-sm menu-transition menu-item ${isActive('/bookmarks') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                书签
              </Link>
              <Link
                href="/favorites"
                className={`px-3 py-2 rounded text-sm menu-transition menu-item ${isActive('/favorites') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                收藏
              </Link>
              <Link
                href="/moyu"
                className={`px-3 py-2 rounded text-sm menu-transition menu-item ${isActive('/moyu') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                摸鱼
              </Link>
              <Link
                href="/tools"
                className={`hidden px-3 py-2 rounded text-sm ${isActive('/tools') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                工具
              </Link>
              <Link
                href="/content/tutorials"
                className={`hidden px-3 py-2 rounded text-sm ${isActive('/content/tutorials') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                教程
              </Link>
              <Link
                href="/content/resources"
                className={`hidden px-3 py-2 rounded text-sm ${isActive('/content/resources') ? 'bg-[#00bba7] text-white' : 'hover:bg-gray-700'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                资源
              </Link>

              {/* 移动端搜索 */}
              <div className="xl:hidden pt-2">
                <SearchWidget />
              </div>

              {/* 移动端天气信息 */}
              <div className="lg:hidden pt-2">
                <WeatherWidget />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;