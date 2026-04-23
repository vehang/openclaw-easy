'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';
import Loading from '@/components/ui/Loading';

// 定义热榜数据类型
interface HotlistItem {
  title: string;
  url: string;
  hotValue: string;
  hotValueNum: number;
  isHot: number;
  isNew: number;
  isRising: number;
}

interface HotlistConfig {
  platformId: string;
  platformName: string;
  platformShortName: string;
  iconUrl: string;
  color: string;
  lastUpdateTime: string | Date;
  sortOrder: number;
}

interface HotlistData {
  config: HotlistConfig;
  items: HotlistItem[];
}

interface HotlistResponse {
  code: number;
  errorMsg: string;
  currentTime: number;
  data: HotlistData[];
}

export default function MoyuPage() {
  const router = useRouter();
  const { toasts, showError, removeToast } = useToast();
  const [hotlistData, setHotlistData] = useState<HotlistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // 加载热榜数据
  const loadHotlistData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/utility/proxy/hotlist');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: HotlistResponse = await response.json();

      console.log('热榜数据响应:', result);

      if (result.code === 0) {
        setHotlistData(result.data || []);
        console.log('热榜数据加载成功，平台数量:', result.data?.length || 0);
      } else {
        throw new Error(result.errorMsg || '获取热榜数据失败');
      }
    } catch (error: any) {
      console.error('加载热榜数据失败:', error);
      const errorMessage = error.message || '获取热榜数据失败，请稍后再试';
      setError(errorMessage);
      showError('加载失败', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadHotlistData();
  }, []);

  // 处理链接点击
  const handleLinkClick = (url: string) => {
    // 在新窗口打开链接
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 返回主页
  const handleGoHome = () => {
    try {
      router.push('/');
    } catch (error) {
      console.error('路由跳转失败:', error);
      // 备用方案
      window.location.href = '/';
    }
  };

  // 重新加载数据
  const handleReload = async () => {
    await loadHotlistData();
  };

  // 计算时间差
  const getTimeAgo = (lastUpdateTime: string | Date) => {
    const now = new Date();
    const updateTime = typeof lastUpdateTime === 'string' ? new Date(lastUpdateTime) : lastUpdateTime;
    const diffMs = now.getTime() - updateTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return `${diffSeconds}秒前`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else {
      return `${diffDays}天前`;
    }
  };

  // 获取热度标签
  const getHotBadge = (item: HotlistItem) => {
    if (item.isHot) {
      return <span className="mr-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-600 rounded">爆</span>;
    }
    if (item.isNew) {
      return <span className="mr-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">新</span>;
    }
    if (item.isRising) {
      return <span className="mr-1 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-600 rounded">升</span>;
    }
    return null;
  };

  return (
    <>
      <Layout
        categories={[]}
        isLoading={loading}
        hasError={!!error}
        onRetry={loadHotlistData}
        useSidebarMargin={false}
        useFlowLayout={hotlistData.length > 0} // 只有在有数据时才使用流式布局
      >
        <div className="bg-gray-50 min-h-full flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <Loading />
                <div className="mt-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">正在加载热榜数据</h3>
                  <p className="text-gray-500">获取最新热点资讯...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] relative">
                {/* 背景装饰 */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute inset-0">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-red-400 rounded-full opacity-20"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animation: `breathe ${2 + Math.random() * 2}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 3}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 主要内容 */}
                <div className="relative z-10 text-center max-w-md mx-auto">
                  {/* 光源效果 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-64 h-32 bg-gradient-radial from-red-500/10 via-red-500/5 to-transparent rounded-full blur-2xl" style={{ animation: 'gentleGlow 3s ease-in-out infinite' }}></div>
                  </div>

                  {/* 错误图标 */}
                  <div className="relative mb-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {/* 装饰环 */}
                    <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-red-200 rounded-full animate-ping opacity-20"></div>
                  </div>

                  {/* 标题和描述 */}
                  <div className="mb-8 space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">加载失败</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {error}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReload();
                      }}
                      className="inline-flex items-center px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ zIndex: 1000, position: 'relative' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重试加载
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGoHome();
                      }}
                      className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ zIndex: 1000, position: 'relative' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      返回主页
                    </button>
                  </div>

                  {/* 提示信息 */}
                  <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-red-200/50 shadow-sm">
                    <p className="text-gray-600 text-xs leading-relaxed">
                      💡 如果问题持续存在，请检查网络连接或联系技术支持
                    </p>
                  </div>
                </div>
              </div>
            ) : hotlistData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] relative">
                {/* 背景装饰 */}
                <div className="absolute inset-0 overflow-hidden">
                  {/* 呼吸星星 */}
                  <div className="absolute inset-0">
                    {[...Array(15)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-teal-400 rounded-full opacity-30"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animation: `breathe ${2 + Math.random() * 2}s ease-in-out infinite`,
                          animationDelay: `${Math.random() * 3}s`
                        }}
                      />
                    ))}
                  </div>

                  {/* 浮动图标 */}
                  <div className="absolute top-1/4 left-1/4" style={{ animation: 'float 6s ease-in-out infinite' }}>
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-teal-500 rounded-full opacity-20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>

                  <div className="absolute top-1/3 right-1/4" style={{ animation: 'float 8s ease-in-out infinite reverse' }}>
                    <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <style jsx>{`
                  @keyframes breathe {
                    0%, 100% { 
                      opacity: 0.2; 
                      transform: scale(1); 
                    }
                    50% { 
                      opacity: 0.6; 
                      transform: scale(1.5); 
                    }
                  }
                  
                  @keyframes float {
                    0%, 100% { 
                      transform: translateY(0px) rotate(0deg); 
                    }
                    50% { 
                      transform: translateY(-10px) rotate(5deg); 
                    }
                  }
                  
                  @keyframes gentleGlow {
                    0%, 100% { 
                      opacity: 0.3;
                      transform: scale(1);
                    }
                    50% { 
                      opacity: 0.5;
                      transform: scale(1.05);
                    }
                  }
                `}</style>

                {/* 主要内容 */}
                <div className="relative z-10 text-center max-w-md mx-auto">
                  {/* 光源效果 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-64 h-32 bg-gradient-radial from-teal-500/10 via-teal-500/5 to-transparent rounded-full blur-2xl" style={{ animation: 'gentleGlow 3s ease-in-out infinite' }}></div>
                  </div>

                  {/* 图标 */}
                  <div className="relative mb-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    {/* 装饰环 */}
                    <div className="absolute inset-0 w-20 h-20 mx-auto border-2 border-teal-200 rounded-full animate-ping opacity-20"></div>
                  </div>

                  {/* 标题和描述 */}
                  <div className="mb-8 space-y-3">
                    <h3 className="text-xl font-semibold text-gray-800">暂无热榜数据</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      当前没有可显示的热榜内容<br />
                      可能是网络问题或数据正在更新中
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleReload();
                      }}
                      className="inline-flex items-center px-6 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ zIndex: 1000, position: 'relative' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      重新加载
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGoHome();
                      }}
                      className="inline-flex items-center px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ zIndex: 1000, position: 'relative' }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      返回主页
                    </button>
                  </div>

                  {/* 提示信息 */}
                  <div className="mt-8 p-4 bg-white/60 backdrop-blur-sm rounded-lg border border-teal-200/50 shadow-sm">
                    <p className="text-gray-600 text-xs leading-relaxed">
                      💡 提示：热榜数据持续更新，如果无法加载，请检查网络连接或稍后再试
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                {hotlistData.map((platform) => (
                  <div key={platform.config.platformId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* 平台头部 */}
                    <div
                      className="px-4 py-3 border-b border-gray-200"
                      style={{ backgroundColor: `${platform.config.color}10` }}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={platform.config.iconUrl}
                          alt={platform.config.platformName}
                          className="w-6 h-6 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/icons/default-icon1.png';
                          }}
                        />
                        <div className="flex items-center gap-1">
                          <h3 className="font-medium text-gray-900">
                            {platform.config.platformName}
                          </h3>
                          <span className="text-xs text-gray-500">
                            （{getTimeAgo(platform.config.lastUpdateTime)}）
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 热榜列表 */}
                    <div
                      className="max-h-80 sm:max-h-96 overflow-y-auto scrollbar-float"
                      style={{ scrollbarGutter: 'stable overlay' }}
                    >
                      {platform.items.map((item, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleLinkClick(item.url)}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex-shrink-0 text-sm font-medium ${index === 0
                                ? 'text-red-500'
                                : index === 1
                                  ? 'text-orange-500'
                                  : index === 2
                                    ? 'text-yellow-500'
                                    : 'text-gray-600'
                                }`}
                            >
                              {index + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors flex-1 mr-2" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}>
                                  {getHotBadge(item)}
                                  {item.title}
                                </h4>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="text-xs text-gray-500">
                                    {item.hotValue}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* Toast 通知 */}
      {toasts.length > 0 && <ToastContainer toasts={toasts} onRemoveToast={removeToast} />}
    </>
  );
}