import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { Tool } from '@/types/IndexToolList';
import { getQRCodeUrl } from '@/utils/toolRedirect';
import { isUserLoggedIn } from '@/utils/auth';
import LoginModal from '@/components/LoginModal';
import { getLinkRel } from '@/lib/utils';

interface SiteCardProps {
  tool: Tool;
  className?: string;
  // 是否显示收费类型标签（默认不显示，仅详情页需要时传入 true）
  showChargeTag?: boolean;
}

const SiteCard: React.FC<SiteCardProps> = ({ tool, className = '', showChargeTag = false }) => {
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState('');
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMagicTooltip, setShowMagicTooltip] = useState(false);
  const [showLoginTooltip, setShowLoginTooltip] = useState(false);

  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [magicTooltipPosition, setMagicTooltipPosition] = useState({ top: 0, left: 0 });
  const [loginTooltipPosition, setLoginTooltipPosition] = useState({ top: 0, left: 0 });

  // 检查工具是否需要登录
  const requiresLogin = tool.sw > 0;
  // 检查用户是否已登录
  const isLoggedIn = isUserLoggedIn();

  // 检测描述文本是否被截断
  const checkIfTruncated = useCallback(() => {
    const element = descriptionRef.current;
    if (element) {
      setIsDescriptionTruncated(
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight
      );
    }
  }, []);

  useEffect(() => {
    checkIfTruncated();
    window.addEventListener('resize', checkIfTruncated);

    return () => {
      window.removeEventListener('resize', checkIfTruncated);
    };
  }, [tool.desc]);

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
    // 使用 URL 的 hash 来确保服务端和客户端一致
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
    // 如果图片加载失败且有备用图标，使用备用图标
    if (imageError && fallbackIcon) {
      return fallbackIcon;
    }

    // 检查工具自带的图片
    if (tool.img && typeof tool.img === 'string' && tool.img.trim()) {
      return tool.img.trim();
    }

    // 尝试从URL生成favicon路径
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

    // 默认图标
    return '/icons/default-icon1.png';
  }, [imageError, fallbackIcon, tool.img, tool.url]);

  // 检查是否应该渲染图片
  const shouldRenderImage = useCallback(() => {
    const src = getIconSrc();
    return src && src.trim() !== '';
  }, [getIconSrc]);

  // 处理工具点击（跳转到定向页）
  const handleToolClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 检查是否需要登录且用户未登录
    if (requiresLogin && !isLoggedIn) {
      // 显示登录弹窗
      setShowLoginModal(true);
      return;
    }

    // 使用新的跳转逻辑
    const { handleToolClick: handleRedirect } = require('@/utils/toolRedirect');

    handleRedirect({
      toolId: tool.id,
      title: tool.title,
      url: tool.url,
      desc: tool.desc,
      img: tool.img,
      source: 'homepage',
      sl: tool.sl
    }, e);
  }, [tool, requiresLogin, isLoggedIn]);

  // 处理二维码按钮点击
  const handleQRCodeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQRCode(!showQRCode);
  }, [showQRCode]);

  // 获取二维码URL
  const getQRCodeURL = useCallback(() => {
    return getQRCodeUrl({
      toolId: tool.id,
      title: tool.title,
      url: tool.url,
      desc: tool.desc,
      img: tool.img,
      source: 'homepage',
      sl: tool.sl
    });
  }, [tool]);

  // 获取 a 标签的 href（使用相对路径，不需要域名）
  const getHref = useCallback(() => {
    // 如果有短地址，使用短地址
    if (tool.sl) {
      return `/redirect?sl=${encodeURIComponent(tool.sl)}`;
    }
    // 否则使用 toolId
    return `/redirect?source=homepage&toolId=${tool.id}`;
  }, [tool.sl, tool.id]);

  // 获取链接的 rel 属性值
  const getLinkRelValue = useCallback(() => {
    const href = getHref();
    return getLinkRel(href, tool.rel);
  }, [getHref, tool.rel]);

  // 处理描述悬停
  const handleDescriptionMouseEnter = useCallback((e: React.MouseEvent) => {
    // 需要登录但用户未登录时，不显示详情弹窗
    if (requiresLogin && !isLoggedIn) {
      return;
    }

    if (isDescriptionTruncated && tool.desc) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
      setShowDescTooltip(true);
    }
  }, [isDescriptionTruncated, tool.desc, requiresLogin, isLoggedIn]);

  const handleDescriptionMouseLeave = useCallback(() => {
    setShowDescTooltip(false);
  }, []);

  // 处理魔珐图标悬停
  const handleMagicIconMouseEnter = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMagicTooltipPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2
    });
    setShowMagicTooltip(true);
  }, []);

  const handleMagicIconMouseLeave = useCallback(() => {
    setShowMagicTooltip(false);
  }, []);

  // 处理登录提示悬停
  const handleCardMouseEnter = useCallback((e: React.MouseEvent) => {
    if (requiresLogin && !isLoggedIn) {
      const rect = e.currentTarget.getBoundingClientRect();
      setLoginTooltipPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
      setShowLoginTooltip(true);
    }
  }, [requiresLogin, isLoggedIn]);

  const handleCardMouseLeave = useCallback(() => {
    setShowLoginTooltip(false);
  }, []);

  return (
    <div className={`relative ${className}`} ref={cardRef}>
      <div className="relative group">
        <a
          href={getHref()}
          target="_blank"
          rel={getLinkRelValue()}
          className={`block p-3 h-full rounded-lg transition-all duration-200 border border-transparent group-hover:shadow-xl group-hover:bg-white group-hover:border-gray-100 ${requiresLogin && !isLoggedIn
            ? 'cursor-pointer' // 需要登录时显示指针光标
            : ''
            }`}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
          onClick={handleToolClick}
        >
          <div className="flex">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0 mt-1 ${requiresLogin && !isLoggedIn ? 'opacity-70' : ''}`}>
              {shouldRenderImage() ? (
                <Image
                  src={getIconSrc()}
                  alt={tool.title || '工具图标'}
                  fill
                  sizes="(max-width: 640px) 20px, 24px"
                  className="rounded object-cover"
                  unoptimized
                  onError={handleImageError}
                />
              ) : (
                // 默认SVG图标作为占位符
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
              )}
            </div>
            <div className="ml-2 flex-1 flex flex-col min-w-0">
              <div className="flex items-center min-w-0 overflow-hidden">
                <h3 className={`font-medium text-xs sm:text-sm group-hover:text-[#39aba4] truncate flex-shrink min-w-0 ${requiresLogin && !isLoggedIn ? 'text-gray-700 opacity-80' : 'text-gray-900'
                  }`}>
                  {tool.title}
                </h3>
                {/* 收费类型标签 - 根据数据库定义：1=免费 2=收费 3=部分收费（默认隐藏，仅在需要的页面传入 showChargeTag 才展示） */}
                {showChargeTag && (tool.charge === 1 || tool.charge === 2 || tool.charge === 3) && (
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
                  <span className={`ml-0.5 sm:ml-1 px-0.5 py-0 text-[6px] sm:text-[7px] rounded border whitespace-nowrap flex-shrink-0 font-medium leading-tight ${requiresLogin && !isLoggedIn
                    ? 'bg-gray-100 text-gray-500 border-gray-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                    {tool.lang.toUpperCase()}
                  </span>
                )}
                {tool.mf === 1 && (
                  <span
                    className={`ml-0.5 sm:ml-1 px-0.5 py-0 text-[6px] sm:text-[7px] rounded border whitespace-nowrap flex-shrink-0 font-medium leading-tight flex items-center cursor-help ${requiresLogin && !isLoggedIn
                      ? 'bg-gray-100 text-gray-500 border-gray-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    onMouseEnter={handleMagicIconMouseEnter}
                    onMouseLeave={handleMagicIconMouseLeave}
                  >
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
              <p
                ref={descriptionRef}
                className={`text-[10px] sm:text-xs line-clamp-1 mt-0.5 cursor-pointer ${requiresLogin && !isLoggedIn ? 'text-gray-400 opacity-60' : 'text-gray-500'
                  }`}
                onMouseEnter={handleDescriptionMouseEnter}
                onMouseLeave={handleDescriptionMouseLeave}
              >
                {tool.desc}
              </p>
            </div>

            {/* 二维码按钮 - 只在桌面端显示，且不需要登录或用户已登录时才显示 */}
            {!(requiresLogin && !isLoggedIn) && (
              <div
                id={`qrcode-btn-${tool.title.replace(/\s+/g, '-')}`}
                className="hidden sm:block w-0 group-hover:w-6 flex-shrink-0 overflow-hidden transition-all duration-200 ml-0 group-hover:ml-2 self-center"
                onClick={handleQRCodeClick}
                onMouseEnter={() => setShowQRCode(true)}
                onMouseLeave={() => setShowQRCode(false)}
              >
                <div className="p-1 hover:bg-gray-100 rounded-full cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </a>

        {/* 详情按钮 - 绝对定位在最外层，紧贴边框，使用 a 标签便于 SEO */}
        {tool.sl && (
          <a
            href={`/site/${tool.sl}`}
            target="_blank"
            // 站内链接不需要 rel 属性，便于 SEO 传递权重
            className="hidden sm:block absolute top-0 right-0 w-0 group-hover:w-4 h-full overflow-hidden transition-all duration-200 rounded-r-lg group"
            title="查看详情"
          >
            <div className={`h-full bg-gradient-to-r from-gray-100 via-gray-150 to-gray-200 hover:bg-gradient-to-r hover:from-[rgba(57,171,164,0.08)] hover:via-[rgba(57,171,164,0.12)] hover:to-[rgba(57,171,164,0.16)] cursor-pointer flex items-center justify-center rounded-r-lg ${requiresLogin && !isLoggedIn ? 'opacity-70' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 group-hover:text-[#39aba4] flex-shrink-0 ${requiresLogin && !isLoggedIn ? 'opacity-70' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        )}
      </div>

      {/* 淡淡的遮罩层 - 需要登录但用户未登录时显示 */}
      {requiresLogin && !isLoggedIn && (
        <div className="absolute inset-0 bg-gray-400 bg-opacity-10 rounded-lg pointer-events-none"></div>
      )}

      {/* 二维码弹窗 - 只在桌面端显示 */}
      {showQRCode && (
        <div className="hidden sm:block fixed z-50 p-4 bg-white rounded-lg shadow-xl" style={{
          top: 'auto',
          left: 'auto',
          right: `${window.innerWidth - (document.getElementById('qrcode-btn-' + tool.title.replace(/\s+/g, '-'))?.getBoundingClientRect().right || 0)}px`,
          bottom: `${window.innerHeight - (document.getElementById('qrcode-btn-' + tool.title.replace(/\s+/g, '-'))?.getBoundingClientRect().top || 0)}px`
        }}>
          <div className="flex flex-col items-center">
            <QRCodeSVG value={getQRCodeURL()} size={90} />
            <p className="mt-2 text-xs text-gray-600">扫码访问</p>
          </div>
        </div>
      )}

      {/* 描述悬停弹窗 */}
      {showDescTooltip && tool.desc && (
        <div
          className="fixed z-[100] p-4 bg-white rounded-lg shadow-xl max-w-xs border border-gray-100 pointer-events-none"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <p className="text-sm text-gray-600">{tool.desc}</p>
        </div>
      )}

      {/* 魔珐访问悬停提示 */}
      {showMagicTooltip && (
        <div
          className="fixed z-[100] px-2 py-1 bg-white text-gray-400 text-xs rounded border border-gray-200 shadow-sm pointer-events-none whitespace-nowrap"
          style={{
            top: `${magicTooltipPosition.top}px`,
            left: `${magicTooltipPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          需要魔珐
        </div>
      )}

      {/* 登录提示悬停弹窗 */}
      {showLoginTooltip && (
        <div
          className="fixed z-[100] px-3 py-2 bg-white text-gray-600 text-sm rounded-lg border border-gray-200 shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            top: `${loginTooltipPosition.top}px`,
            left: `${loginTooltipPosition.left}px`,
            transform: 'translateX(-50%)'
          }}
        >
          点击后登录，即可正常使用！
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default SiteCard;