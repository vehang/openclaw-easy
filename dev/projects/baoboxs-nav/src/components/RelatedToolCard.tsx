import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { Tool } from '@/types/IndexToolList';
import { isUserLoggedIn } from '@/utils/auth';
import LoginModal from '@/components/LoginModal';
import { getLinkRel } from '@/lib/utils';

interface RelatedToolCardProps {
  tool: Tool;
  className?: string;
}

const RelatedToolCard: React.FC<RelatedToolCardProps> = ({ tool, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  // 检查工具是否需要登录
  const requiresLogin = tool.sw > 0;
  // 检查用户是否已登录
  const isLoggedIn = isUserLoggedIn();

  // 默认图标数组
  const defaultIcons = [
    '/icons/default-icon1.png',
    '/icons/default-icon2.png',
    '/icons/default-icon3.png',
    '/icons/default-icon4.png',
    '/icons/default-icon5.png',
  ];

  // 当图片加载失败时，选择一个默认图标
  const handleImageError = useCallback(() => {
    const urlHash = tool.url ? tool.url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;
    const randomIndex = Math.abs(urlHash) % defaultIcons.length;
    setFallbackIcon(defaultIcons[randomIndex]);
    setImageError(true);
  }, [tool.url, defaultIcons]);

  // 获取图标源
  const getIconSrc = useCallback(() => {
    if (imageError && fallbackIcon) {
      return fallbackIcon;
    }

    if (tool.img && typeof tool.img === 'string' && tool.img.trim()) {
      return tool.img.trim();
    }

    if (tool.url && typeof tool.url === 'string') {
      try {
        const match = tool.url.match(/^(https?:\/\/[^/]+)/);
        if (match && match[1]) {
          return match[1] + '/favicon.ico';
        }
      } catch (error) {
        console.error('Error parsing URL for favicon:', error);
      }
    }

    return '/icons/default-icon1.png';
  }, [imageError, fallbackIcon, tool.img, tool.url]);

  // 处理点击事件（主要用于登录检查）
  const handleClick = useCallback((e: React.MouseEvent) => {
    // 检查是否需要登录且用户未登录
    if (requiresLogin && !isLoggedIn) {
      e.preventDefault(); // 阻止 a 标签的默认跳转行为
      setShowLoginModal(true);
    }
    // 如果已登录或不需要登录，让 a 标签正常跳转（SEO 友好）
  }, [requiresLogin, isLoggedIn]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative group">
        <a
          href={tool.sl ? `/site/${tool.sl}` : '#'}
          target={tool.sl ? "_blank" : undefined}
          rel={getLinkRel(tool.sl ? `/site/${tool.sl}` : '')}
          onClick={handleClick}
          className={`block p-3 h-full rounded-lg transition-all duration-200 border border-transparent group-hover:shadow-xl group-hover:bg-white group-hover:border-gray-100 ${
            requiresLogin && !isLoggedIn ? 'opacity-70' : ''
          }`}
        >
          <div className="flex">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 mt-1 ${requiresLogin && !isLoggedIn ? 'opacity-70' : ''}`}>
              <Image
                src={getIconSrc()}
                alt={tool.title || '工具图标'}
                fill
                sizes="(max-width: 640px) 20px, 24px"
                className="rounded object-cover"
                unoptimized
                onError={handleImageError}
              />
            </div>
            <div className="ml-2 flex-1 flex flex-col min-w-0">
              <div className="flex items-center min-w-0 overflow-hidden">
                <h3 className={`font-medium text-xs sm:text-sm group-hover:text-[#39aba4] truncate flex-shrink min-w-0 ${
                  requiresLogin && !isLoggedIn ? 'text-gray-700 opacity-80' : 'text-gray-900'
                }`}>
                  {tool.title}
                </h3>
                {/* 收费类型标签 */}
                {(tool.charge === 1 || tool.charge === 2 || tool.charge === 3) && (
                  <span className={`ml-0.5 sm:ml-1 px-0.5 py-0 text-[6px] sm:text-[7px] rounded border whitespace-nowrap flex-shrink-0 font-medium leading-tight ${
                    tool.charge === 1 ? 'bg-green-100 text-green-800 border-green-200' :
                    tool.charge === 2 ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-lime-100 text-lime-800 border-lime-200'
                  }`}>
                    {tool.charge === 1 ? '免费' :
                     tool.charge === 2 ? '收费' :
                     '部分免费'}
                  </span>
                )}
                {tool.lang && (
                  <span className={`ml-0.5 sm:ml-1 px-0.5 py-0 text-[6px] sm:text-[7px] rounded border whitespace-nowrap flex-shrink-0 font-medium leading-tight ${
                    requiresLogin && !isLoggedIn
                      ? 'bg-gray-100 text-gray-500 border-gray-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {tool.lang.toUpperCase()}
                  </span>
                )}
                {tool.mf === 1 && (
                  <span className={`ml-0.5 sm:ml-1 px-0.5 py-0 text-[6px] sm:text-[7px] rounded border whitespace-nowrap flex-shrink-0 font-medium leading-tight flex items-center ${
                    requiresLogin && !isLoggedIn
                      ? 'bg-gray-100 text-gray-500 border-gray-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    <Image
                      src="/icons/mofa.svg"
                      alt="魔珐访问"
                      width={8}
                      height={8}
                      className="w-2 h-2"
                      unoptimized
                    />
                  </span>
                )}
              </div>
              <p className={`text-[10px] sm:text-xs line-clamp-1 mt-0.5 ${
                requiresLogin && !isLoggedIn ? 'text-gray-400 opacity-60' : 'text-gray-500'
              }`}>
                {tool.desc}
              </p>
            </div>
          </div>
        </a>
      </div>

      {/* 淡淡的遮罩层 - 需要登录但用户未登录时显示 */}
      {requiresLogin && !isLoggedIn && (
        <div className="absolute inset-0 bg-gray-400 bg-opacity-10 rounded-lg pointer-events-none"></div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default RelatedToolCard;

