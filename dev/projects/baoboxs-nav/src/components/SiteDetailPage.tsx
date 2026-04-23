'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { addToFrequentTools } from '@/utils/frequentToolsManager';
import { isUserLoggedIn } from '@/utils/auth';
import LoginModal from '@/components/LoginModal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { handleToolClick, getQRCodeUrl } from '@/utils/toolRedirect';
import { QRCodeSVG } from 'qrcode.react';
import RelatedToolCard from '@/components/RelatedToolCard';
import { fetchRelatedTools } from '@/services/api';
import { Tool } from '@/types/IndexToolList';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';
import SiteFeedbackModal from '@/components/SiteFeedbackModal';
import { getLinkRel } from '@/lib/utils';


interface SiteDetailPageProps {
  siteDetail: {
    id: number;
    title: string;
    desc: string;
    img: string;
    url: string;
    lang: string;
    charge: number;
    un: number;
    sw: number;
    mf?: number;
    sl?: string;
    markdownContent?: string;
    viewCount?: number;
    tags?: string[];
    createdAt?: string; // 创建时间/收录时间，ISO格式如 "2024-01-15T10:30:00Z"
    contentSource?: string; // 详情内容来源说明
  };
  currentUrl?: string; // 当前页面 URL，用于服务端渲染
}

const SiteDetailPage: React.FC<SiteDetailPageProps> = ({ siteDetail, currentUrl: serverUrl }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIcon, setFallbackIcon] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [urlCheckStatus, setUrlCheckStatus] = useState<'checking' | 'success' | 'error' | null>(null);
  const [urlCheckTime, setUrlCheckTime] = useState<number | null>(null);
  const [relatedTools, setRelatedTools] = useState<Tool[]>([]);
  const [relatedToolsLoading, setRelatedToolsLoading] = useState(true);
  const [showSiteFeedbackModal, setShowSiteFeedbackModal] = useState(false);
  const [defaultFeedbackType, setDefaultFeedbackType] = useState<string | undefined>(undefined);
  const [currentUrl, setCurrentUrl] = useState(serverUrl || '');
  const { toasts, showSuccess, showError, removeToast } = useToast();

  // 计算相对时间
  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInYears > 0) {
      return `${diffInYears}年前发布`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths}个月前发布`;
    } else if (diffInDays > 0) {
      return `${diffInDays}天前发布`;
    } else {
      return '今天发布';
    }
  };

  // 格式化日期为 YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // 使用 iframe 预览网站
  const [showIframe, setShowIframe] = useState(false);
  
  const toggleIframePreview = useCallback(() => {
    setShowIframe(!showIframe);
  }, [showIframe]);

  // 获取二维码URL
  const getQRCodeURL = useCallback(() => {
    return getQRCodeUrl({
      toolId: siteDetail.id,
      title: siteDetail.title,
      url: siteDetail.url,
      desc: siteDetail.desc,
      img: siteDetail.img,
      source: 'homepage',
      sl: siteDetail.sl
    });
  }, [siteDetail]);

  // URL可用性检测
  const checkUrlAvailability = useCallback(async () => {
    if (!siteDetail.url) return;
    
    setUrlCheckStatus('checking');
    const startTime = Date.now();
    
    try {
      // 使用fetch检测URL可用性
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(siteDetail.url, {
        method: 'HEAD', // 只获取头部信息，不下载内容
        mode: 'no-cors', // 避免CORS问题
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setUrlCheckTime(duration);
      setUrlCheckStatus('success');
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      setUrlCheckTime(duration);
      setUrlCheckStatus('error');
      console.warn('URL检测失败:', error);
    }
  }, [siteDetail.url]);

  // 获取相关推荐工具
  const loadRelatedTools = useCallback(async () => {
    // 优先使用短地址，如果没有则使用工具ID
    const identifier = siteDetail.sl || siteDetail.id?.toString();
    if (!identifier) return;
    
    setRelatedToolsLoading(true);
    try {
      const tools = await fetchRelatedTools(identifier);
      setRelatedTools(tools);
    } catch (error) {
      console.error('获取相关推荐工具失败:', error);
      setRelatedTools([]);
    } finally {
      setRelatedToolsLoading(false);
    }
  }, [siteDetail.sl, siteDetail.id]);

  // 在客户端更新当前页面 URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // 页面加载后自动检测URL可用性和获取相关推荐
  useEffect(() => {
    // 延迟1秒后开始检测，确保页面完全加载
    const timer = setTimeout(() => {
      checkUrlAvailability();
      loadRelatedTools();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkUrlAvailability, loadRelatedTools]);

  // 检查工具是否需要登录
  const requiresLogin = siteDetail.sw > 0;
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
    const urlHash = siteDetail.url ? siteDetail.url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0) : 0;
    const randomIndex = Math.abs(urlHash) % defaultIcons.length;
    setFallbackIcon(defaultIcons[randomIndex]);
    setImageError(true);
  }, [siteDetail.url, defaultIcons]);

  // 获取图标源
  const getIconSrc = useCallback(() => {
    if (imageError && fallbackIcon) {
      return fallbackIcon;
    }

    if (siteDetail.img && typeof siteDetail.img === 'string' && siteDetail.img.trim()) {
      return siteDetail.img.trim();
    }

    if (siteDetail.url && typeof siteDetail.url === 'string') {
      try {
        const match = siteDetail.url.match(/^(https?:\/\/[^/]+)/);
        if (match && match[1]) {
          return match[1] + '/favicon.ico';
        }
      } catch (error) {
        console.error('Error parsing URL for favicon:', error);
      }
    }

    return '/icons/default-icon1.png';
  }, [imageError, fallbackIcon, siteDetail.img, siteDetail.url]);

  // 处理访问按钮点击
  const handleVisitClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 检查是否需要登录且用户未登录
    if (requiresLogin && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // 使用统一的工具跳转处理函数，支持短地址定向跳转
    handleToolClick({
      toolId: siteDetail.id,
      title: siteDetail.title,
      url: siteDetail.url,
      desc: siteDetail.desc,
      img: siteDetail.img,
      source: 'homepage',
      sl: siteDetail.sl
    }, e);
  }, [siteDetail, requiresLogin, isLoggedIn]);

  // 处理收藏按钮点击
  const handleFavoriteClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsFavorited(!isFavorited);
    console.log('收藏站点:', siteDetail.title);
  }, [siteDetail.title, isLoggedIn, isFavorited]);

  // 处理反馈按钮点击
  const handleFeedbackClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 使用 flushSync 强制同步更新，确保弹窗打开前状态已更新
    flushSync(() => {
      setDefaultFeedbackType(undefined);  // 重置为默认选项
      setShowSiteFeedbackModal(true);
    });
  }, []);

  // 获取收费类型标签
  const getChargeTypeLabel = () => {
    switch (siteDetail.charge) {
      case 1: return { text: '免费', color: 'bg-green-100 text-green-800 border-green-200' };
      case 2: return { text: '收费', color: 'bg-red-100 text-red-800 border-red-200' };
      case 3: return { text: '部分收费', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      default: return { text: '未知', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const chargeType = getChargeTypeLabel();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* 主要布局：左侧内容，右侧预览 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* 左侧：站点详细信息 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 面包屑导航 */}
            <div className="mb-6">
               <nav className="flex items-center space-x-2 text-sm">
                 <Link href="/" className="text-[#00bba7] hover:text-[#00a593] transition-colors">
                   首页
                 </Link>
                 <span className="text-gray-400">&gt;</span>
                 <span className="text-gray-600">页面详情</span>
               </nav>
            </div>

            <div className="flex items-start space-x-4 mb-6">
              {/* 站点图标 */}
              <div className="w-16 h-16 relative flex-shrink-0">
                <div className="w-full h-full bg-white rounded-lg shadow-md border border-gray-200 flex items-center justify-center overflow-hidden">
                  <Image
                    src={getIconSrc()}
                    alt={siteDetail.title}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded object-cover"
                    unoptimized
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* 站点信息 */}
              <div className="flex-1 min-w-0">
                 <div className="flex items-end space-x-2 mb-2">
                   <h1 className="text-xl font-bold text-[#00bba7] leading-tight">
                     {siteDetail.title}
                   </h1>
                   
                   {/* 收费类型标签 - 根据数据库定义：1=免费 2=收费 3=部分收费 */}
                   {(siteDetail.charge === 1 || siteDetail.charge === 2 || siteDetail.charge === 3) && (
                     <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                       siteDetail.charge === 1 ? 'bg-green-100 text-green-800' :
                       siteDetail.charge === 2 ? 'bg-red-100 text-red-800' :
                       'bg-lime-100 text-lime-800'
                     }`}>
                       {siteDetail.charge === 1 ? '免费' :
                        siteDetail.charge === 2 ? '收费' :
                        '部分免费'}
                     </span>
                   )}
                   
                  {siteDetail.lang && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded">
                      {siteDetail.lang.toUpperCase()}
                    </span>
                  )}
                  {siteDetail.mf === 1 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-800 rounded flex items-center">
                      <Image
                        src="/icons/mofa.svg"
                        alt="魔珐访问"
                        width={8}
                        height={8}
                        className="w-2 h-2 mr-1"
                        unoptimized
                      />
                      魔珐
                    </span>
                  )}
                </div>

                {/* 元数据信息 */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  {siteDetail.createdAt && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {getRelativeTime(siteDetail.createdAt)}
                    </div>
                  )}
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {(siteDetail.viewCount || siteDetail.un || 0).toLocaleString()}
                  </div>
                </div>

                <p className="text-gray-600 mb-4 leading-relaxed text-base">
                  {siteDetail.desc}
                </p>

                {/* 收录时间 */}
                {siteDetail.createdAt && (
                  <div className="text-sm text-gray-500 mb-4">
                    收录时间: {formatDate(siteDetail.createdAt)}
                  </div>
                )}

                 {/* 标签组 */}
                 <div className="flex flex-wrap items-center gap-2 mb-4">
                   {/* 其他标签 */}
                   {siteDetail.tags && siteDetail.tags.map((tag, index) => (
                     <span
                       key={index}
                       className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                     >
                       {tag}
                     </span>
                   ))}
                 </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-2">
                   <button
                     onClick={handleVisitClick}
                     className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${
                       requiresLogin && !isLoggedIn
                         ? 'bg-gradient-to-r from-[#e6f7f5] to-[#d9f2ef] text-[#00bba7]'
                         : 'bg-gradient-to-r from-[#00bba7] to-[#00a593] hover:from-[#00a593] hover:to-[#009080] text-white'
                     }`}
                   >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    打开网站 &gt;
                  </button>

                  {/* 收藏按钮已隐藏 */}
                  {/* <button
                    onClick={handleFavoriteClick}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border ${
                      isFavorited 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <svg className={`w-4 h-4 md:mr-2 ${isFavorited ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="hidden md:inline">{isFavorited ? '已收藏' : '收藏'}</span>
                  </button> */}

                   <button 
                     id={`qrcode-btn-${siteDetail.id}`}
                     className={`hidden md:flex px-4 py-2 rounded-lg font-medium transition-all duration-300 items-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 border relative ${
                       requiresLogin && !isLoggedIn
                         ? 'border-gray-300 text-gray-400'
                         : 'border-[#00bba7] text-[#00bba7] hover:bg-[#00bba7] hover:text-white'
                     }`}
                     onClick={() => {
                       if (requiresLogin && !isLoggedIn) {
                         setShowLoginModal(true);
                       } else {
                         setShowQRCode(!showQRCode);
                       }
                     }}
                     onMouseEnter={() => !(requiresLogin && !isLoggedIn) && setShowQRCode(true)}
                     onMouseLeave={() => !(requiresLogin && !isLoggedIn) && setShowQRCode(false)}
                   >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    手机查看
                  </button>

                  <button
                    onClick={handleFeedbackClick}
                    className="p-2 rounded-lg font-medium transition-all duration-300 flex items-center text-sm shadow-md hover:shadow-lg transform hover:-translate-y-0.5 bg-red-100 text-red-600 border border-red-200 hover:bg-red-200"
                    title="反馈问题"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </button>
                </div>

                {/* 登录提示 */}
                {requiresLogin && !isLoggedIn && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    点击登录后，即可正常访问
                  </div>
                )}

                {/* URL检测结果显示 */}
                {urlCheckStatus && (
                  <div className="mt-3">
                    {urlCheckStatus === 'checking' && (
                      <div className="flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        正在检测网站可用性...
                      </div>
                    )}
                    
                    {urlCheckStatus === 'success' && urlCheckTime && (
                      <div className="flex items-center text-sm text-green-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        访问正常，检测耗时: {urlCheckTime}ms
                      </div>
                    )}
                    
                    {urlCheckStatus === 'error' && (
                      <div className="flex items-center text-sm text-red-600">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        访问异常，请检测一下网络环境
                        <button
                          onClick={checkUrlAvailability}
                          className="ml-2 p-1 text-red-600 rounded hover:bg-red-100 transition-colors"
                          title="重试检测"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右侧：站点预览区域 */}
          <div className="hidden lg:block lg:col-span-1 flex justify-end">
            <div className="relative w-80">
               {/* 预览框架 - 正方形，稍微大一点的尺寸 */}
               <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-200 w-full aspect-square">
                 <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
                   {/* 模拟浏览器头部 - 只显示圆点，隐藏URL */}
                   <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200 flex items-center space-x-2 flex-shrink-0">
                     <div className="flex space-x-1">
                       <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
                       <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
                       <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
                     </div>
                     <div className="flex-1 bg-white rounded px-2 py-0.5 text-[10px] text-gray-500 truncate">
                       {/* URL 已隐藏 */}
                     </div>
                   </div>
                   
                   {/* 预览内容区域 */}
                   <div className="flex-1 relative overflow-hidden">
                     {showIframe ? (
                       <>
                         <iframe
                           src={siteDetail.url}
                           className="w-full h-full border-0"
                           sandbox="allow-scripts allow-same-origin allow-forms"
                           loading="lazy"
                           onError={() => setShowIframe(false)}
                           style={{
                             width: '100%',
                             height: '100%',
                             border: 'none',
                             outline: 'none',
                             display: 'block',
                             margin: 0,
                             padding: 0,
                             position: 'absolute',
                             top: 0,
                             left: 0
                           }}
                         />
                         {/* 遮罩层和关闭按钮 */}
                         <div className="absolute top-2 right-2 z-10">
                           <button
                             onClick={toggleIframePreview}
                             className="bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-opacity-70 transition-all"
                           >
                             ×
                           </button>
                         </div>
                         <div className="absolute bottom-2 left-2 right-2 z-10">
                           <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded text-center">
                             实时预览 - 点击访问完整站点
                           </div>
                         </div>
                       </>
                     ) : (
                      <div className="p-4 flex flex-col items-center justify-center bg-gradient-to-br from-[#e6f7f5] to-[#f0faf9] h-full">
                        <div className="w-12 h-12 bg-white rounded-lg shadow-md flex items-center justify-center mx-auto mb-3">
                          <Image
                            src={getIconSrc()}
                            alt={siteDetail.title}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded object-cover"
                            unoptimized
                            onError={handleImageError}
                          />
                        </div>
                         <h4 className="text-sm font-semibold text-gray-900 mb-2">{siteDetail.title}</h4>
                         <p className="text-xs text-gray-600 mb-3 max-w-xs line-clamp-2">{siteDetail.desc}</p>
                         <button 
                           onClick={toggleIframePreview}
                           className="px-4 py-2 text-xs bg-gradient-to-r from-[#e6f7f5] to-[#d9f2ef] hover:from-[#d9f2ef] hover:to-[#c7ebe7] text-[#00a593] border border-[#00bba7] rounded-lg transition-colors font-medium"
                         >
                           实时预览
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 下方内容区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧主要内容区域 */}
          <div className="lg:col-span-3">

            {/* 详细介绍区域 - 参考原网站样式 */}
            {siteDetail.markdownContent && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6">
                  <div className="prose prose-gray max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">{children}</h3>,
                        ul: ({children}) => <ul className="list-disc pl-8 mb-4">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-8 mb-4">{children}</ol>,
                        p: ({children}) => <p className="text-gray-700 mb-4 leading-relaxed">{children}</p>,
                        a: ({href, children}) => <a href={href} target="_blank" rel={getLinkRel(href || '')} className="text-blue-600 hover:text-blue-800 underline">{children}</a>,
                        code: ({children}) => <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                        pre: ({children}) => <pre className="bg-gray-100 text-gray-800 p-4 rounded-lg mb-4 overflow-x-auto"><code className="text-sm font-mono">{children}</code></pre>,
                      }}
                    >
                      {siteDetail.markdownContent}
                    </ReactMarkdown>
                  </div>
                  {/* 内容来源说明和纠错按钮 */}
                  {siteDetail.contentSource && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{siteDetail.contentSource}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDefaultFeedbackType('9');
                          setShowSiteFeedbackModal(true);
                        }}
                        className="text-sm text-[#00bba7] hover:text-[#00a593] transition-colors cursor-pointer"
                      >
                        纠错
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 特别说明卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  特别说明
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-3">
                  本页面信息仅供参考，不做为推荐和建议依据，使用前建议您仔细阅读目标网站的服务条款和隐私政策，注意保护个人隐私和数据安全，请您自行斟酌并谨慎使用。内容来源于用户推荐及网络公开资料，仅供学习参考，本站不承担第三方网站责任。站点收录时，未发现明显不合规内容，如您发现不合规情况，欢迎反馈，我们会及时处理。
                </p>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-400 bg-gray-100 p-2 rounded">
                  <span className="mb-1 md:mb-0">程序员宝盒致力于收集高效、优质、实用的站点资源</span>
                  <div className="flex items-center">
                    <span className="mr-2">本文地址：{currentUrl}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentUrl).then(() => {
                          showSuccess('复制成功', '页面地址已复制到剪贴板');
                        }).catch(err => {
                          showError('复制失败', '无法复制地址，请手动复制');
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title="复制地址"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <span className="ml-2">转载烦请注明</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧边栏 - 参考原网站样式 */}
          <div className="lg:col-span-1">
            {/* 相关推荐 - 使用SiteCard组件 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                相关推荐
              </h3>
              
              {/* 推荐工具列表 */}
              {relatedToolsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="animate-pulse">
                      <div className="flex items-start space-x-3 p-3">
                        <div className="w-6 h-6 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : relatedTools.length > 0 ? (
                <div className="space-y-3">
                  {relatedTools.map((tool) => (
                    <RelatedToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.571M15 6.343A7.962 7.962 0 0112 4c-2.34 0-4.29 1.009-5.824 2.571" />
                  </svg>
                  <p className="text-sm">暂无相关推荐</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* 站点反馈弹窗 */}
      <SiteFeedbackModal
        isOpen={showSiteFeedbackModal}
        onClose={() => {
          setShowSiteFeedbackModal(false);
          setDefaultFeedbackType(undefined);
        }}
        toolId={siteDetail.id}
        toolShortUrl={siteDetail.sl}
        onShowSuccess={showSuccess}
        onShowError={showError}
        defaultFeedbackType={defaultFeedbackType}
      />

      {/* 二维码弹窗 */}
      {showQRCode && !(requiresLogin && !isLoggedIn) && (
        <div className="hidden md:block fixed z-50 p-3 bg-white rounded-lg shadow-xl border border-gray-200" style={{
          top: `${(document.getElementById(`qrcode-btn-${siteDetail.id}`)?.getBoundingClientRect().top || 0) - 180}px`,
          left: `${(document.getElementById(`qrcode-btn-${siteDetail.id}`)?.getBoundingClientRect().left || 0) + (document.getElementById(`qrcode-btn-${siteDetail.id}`)?.getBoundingClientRect().width || 0) / 2 - 60}px`
        }}>
          <div className="flex flex-col items-center">
            <QRCodeSVG value={getQRCodeURL()} size={120} />
            <p className="mt-2 text-xs text-gray-600 text-center">手机扫码访问</p>
          </div>
        </div>
      )}

      {/* Toast 消息提示 */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default SiteDetailPage;
