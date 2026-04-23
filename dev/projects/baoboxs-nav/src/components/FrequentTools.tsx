'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { addToFrequentTools, mergeFrequentToolsForDisplay } from '@/utils/frequentToolsManager';
import { Tool, Category } from '@/types/IndexToolList'; // 直接引入Tool类型和Category类型
import { useAuth } from '@/hooks/useAuth';
import { useFrequentToolsSync } from '@/hooks/useFrequentToolsSync';
import { USER_DATA_UPDATED_EVENT } from '@/constants/storage';
import { EVENTS } from '@/constants/events';
import { handleFrequentToolClick } from '@/utils/toolRedirect';
import { slCacheManager } from '@/utils/slCacheManager';
import { useFrequentToolsSyncContext } from '@/contexts/FrequentToolsSyncContext';
import { getLinkRel } from '@/lib/utils';

// 删除本地的interface Tool定义

interface FrequentToolsProps {
  tools: Tool[];
  onToolClick: (id: number) => void;
  categories?: Category[]; // 新增：首页分类数据，用于补全sl字段
}

const FrequentTools: React.FC<FrequentToolsProps> = ({ tools, onToolClick, categories }) => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated } = useAuth();
  const { manualSync, manualSyncing } = useFrequentToolsSync();
  const { isSyncEnabled, setIsSyncEnabled, lastSyncTime, setLastSyncTime } = useFrequentToolsSyncContext();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 切换同步设置
  const handleToggleSync = () => {
    const newSyncState = !isSyncEnabled;
    setIsSyncEnabled(newSyncState);
  };

  // 处理手动同步
  const handleManualSync = async () => {
    console.log('🖱️ handleManualSync 被调用，manualSyncing:', manualSyncing, 'cooldownRemaining:', cooldownRemaining);

    // 检查冷却时间
    if (manualSyncing || cooldownRemaining > 0) {
      console.log('🖱️ 手动同步正在进行中或还在冷却中，阻止点击');
      return; // 防止重复点击
    }

    console.log('🖱️ 开始执行 manualSync');
    setLastClickTime(Date.now());
    await manualSync();
    console.log('🖱️ manualSync 执行完成');

    // 开始冷却倒计时
    let remaining = 10;
    setCooldownRemaining(remaining);

    const countdownInterval = setInterval(() => {
      remaining -= 1;
      setCooldownRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);
  };

  // 格式化冷却时间显示
  const formatCooldownTime = (seconds: number) => {
    if (seconds <= 0) return '';
    return `[${seconds}s]`;
  };

  // 格式化最后同步时间
  const formatLastSyncTime = (time: string) => {
    if (!time) return '从未同步';
    if (!isClient) return '从未同步'; // 防止hydration错误
    try {
      const date = new Date(time);
      return date.toLocaleString('zh-CN');
    } catch {
      return '从未同步';
    }
  };

  // 获取合并后的工具数据（Layout已经负责合并本地和线上数据）
  const mergedTools = useMemo(() => {
    // 如果传入了 tools prop（Layout合并后的数据），直接使用
    if (tools && tools.length > 0) {
      console.log('🔄 [FrequentTools] 使用传入的 tools prop（已合并），数量:', tools.length);
      return tools;
    }
    // 否则使用本地数据
    console.log('🔄 [FrequentTools] 使用本地数据');
    return mergeFrequentToolsForDisplay(isAuthenticated);
  }, [isAuthenticated, refreshTrigger, tools]);

  // 根据登录状态过滤工具
  const filteredTools = mergedTools.filter(tool => {
    // 如果工具需要登录但用户未登录，则不显示
    if (tool.requireLogin && !isAuthenticated) {
      return false;
    }
    return true;
  });

  // 监听本地数据变化，触发合并刷新
  useEffect(() => {
    if (!isClient) return;

    const handleLocalStorageChange = (e: Event) => {
      // 监听本地常用工具数据的变化
      if (e.type === 'storage') {
        const storageEvent = e as StorageEvent;
        if (storageEvent.key === 'frequent-tools-visits-v3') {
          console.log('检测到本地常用工具数据变化，触发合并刷新');
          setRefreshTrigger(prev => prev + 1);
        }
        // 监听云端缓存的变化
        if (storageEvent.key === 'frequent-tools-cloud-cache') {
          console.log('检测到云端缓存变化，触发合并刷新');
          setRefreshTrigger(prev => prev + 1);
        }
      } else if (e.type === 'localStorageChanged') {
        const customEvent = e as CustomEvent;
        if (customEvent.detail?.key === 'frequent-tools-visits-v3') {
          console.log('检测到本地常用工具数据变化（自定义事件），触发合并刷新');
          setRefreshTrigger(prev => prev + 1);
        }
        // 监听云端缓存的变化
        if (customEvent.detail?.key === 'frequent-tools-cloud-cache') {
          console.log('检测到云端缓存变化（自定义事件），触发合并刷新');
          setRefreshTrigger(prev => prev + 1);
        }
      }
    };

    // 监听浏览器原生storage事件
    window.addEventListener('storage', handleLocalStorageChange);
    // 监听自定义localStorage变化事件
    window.addEventListener(EVENTS.LOCAL_STORAGE_CHANGED, handleLocalStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleLocalStorageChange);
      window.removeEventListener(EVENTS.LOCAL_STORAGE_CHANGED, handleLocalStorageChange as EventListener);
    };
  }, [isClient]);

  // 预加载sl字段到缓存（仅当categories存在且缓存为空时执行）
  useEffect(() => {
    // 只在客户端环境中执行
    if (isClient && categories && categories.length > 0) {
      slCacheManager.preloadSLs(categories);
    }
  }, [categories, isClient]);

  // 使用缓存管理器补全工具的sl字段（高性能，仅需O(n)时间复杂度）
  // 同时确保工具数量不超过24个
  const enrichedTools = useMemo(() => {
    const limitedTools = filteredTools.slice(0, 24);
    return slCacheManager.enrichTools(limitedTools);
  }, [filteredTools]);

  // 默认图标数组
  const defaultIcons = [
    '/icons/default-icon1.png',
    '/icons/default-icon2.png',
    '/icons/default-icon3.png',
    '/icons/default-icon4.png',
    '/icons/default-icon5.png',
  ];

  // 当图片加载失败时，随机选择一个默认图标
  const handleImageError = (id: number) => {
    setImageErrors(prev => ({
      ...prev,
      [id]: true
    }));
  };

  // 获取安全的图片源
  const getSafeImageSrc = (tool: Tool) => {
    if (imageErrors[tool.id]) {
      // 使用工具ID作为种子，确保server和client返回相同的图标
      const seed = tool.id.toString().charCodeAt(0);
      return defaultIcons[seed % defaultIcons.length];
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
  };

  // 检查是否应该渲染图片
  const shouldRenderImage = (tool: Tool) => {
    const src = getSafeImageSrc(tool);
    return src && src.trim() !== '';
  };

  if (enrichedTools.length === 0) {
    return null;
  }

  return (
    <div className="mb-4" id="frequent-tools-section">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-extrabold text-[#2a8a84]">常用工具</h2>
        <div className="flex items-center text-[10px] text-gray-400">
          {isAuthenticated ? (
            <>
              {/* 登录状态：显示同步控制 */}
              {!isSyncEnabled ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  当前常用工具仅本地缓存
                </>
              ) : (
                <span className="flex items-center">
                  <div className="flex items-center mr-1">
                    {cooldownRemaining > 0 && (
                      <span className="mr-1 text-gray-400 text-[10px]">{formatCooldownTime(cooldownRemaining)}</span>
                    )}
                    <button
                      onClick={handleManualSync}
                      disabled={manualSyncing || cooldownRemaining > 0}
                      className={`flex items-center focus:outline-none focus:ring-1 focus:ring-[#2a8a84] focus:ring-offset-1 rounded ${
                        manualSyncing || cooldownRemaining > 0
                          ? 'cursor-not-allowed text-gray-400'
                          : 'cursor-pointer hover:text-[#2a8a84]'
                      }`}
                      title={
                        manualSyncing
                          ? "正在同步..."
                          : cooldownRemaining > 0
                          ? `冷却中，请等待 ${formatCooldownTime(cooldownRemaining)}`
                          : "点击手动同步"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-3 w-3 ${manualSyncing ? 'animate-spin' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <span>上次同步: {formatLastSyncTime(lastSyncTime)}</span>
                </span>
              )}

              {/* 开关按钮 */}
              <button
                onClick={handleToggleSync}
                className="ml-2 relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#2a8a84] focus:ring-offset-1"
                style={{ backgroundColor: isSyncEnabled ? '#2a8a84' : '#d1d5db' }}
                title={isSyncEnabled ? "关闭自动同步" : "开启自动同步"}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    isSyncEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </>
          ) : (
            <>
              {/* 未登录状态：只显示基础文本 */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              当前常用工具仅本地缓存，登录可同步云端
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-2 sm:gap-3 md:gap-4">
        {enrichedTools.map(tool => (
          <div key={tool.id} className="relative group">
            <a
              href={(() => {
                // 构建中间页面URL
                const params = new URLSearchParams();
                if (tool.sl) {
                  params.set('sl', tool.sl);
                } else {
                  params.set('source', (tool.lastSource as 'homepage' | 'bookmark' | 'favorite') || 'homepage');
                  if (tool.id) {
                    params.set('toolId', tool.id.toString());
                  }
                }
                return `/redirect?${params.toString()}`;
              })()}
              target="_blank"
              rel={getLinkRel(`/redirect?${new URLSearchParams(
                tool.sl
                  ? { sl: tool.sl }
                  : {
                      source: (tool.lastSource as 'homepage' | 'bookmark' | 'favorite') || 'homepage',
                      ...(tool.id ? { toolId: tool.id.toString() } : {})
                    }
              ).toString()}`)}
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200 border border-transparent hover:border-gray-100"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                // 打印工具的完整数据，用于调试
                if (tool.lastSource === 'favorite') {
                  console.log('收藏工具完整数据:', {
                    id: tool.id,
                    title: tool.title,
                    url: tool.url,
                    bindId: tool.bindId,
                    urlId: (tool as any).urlId,
                    uniqueKey: tool.uniqueKey,
                    sl: tool.sl,
                    lastSource: tool.lastSource,
                    sources: tool.sources
                  });
                } else if (tool.lastSource === 'bookmark') {
                  console.log('书签工具完整数据:', {
                    id: tool.id,
                    title: tool.title,
                    url: tool.url,
                    bindId: tool.bindId,
                    urlId: (tool as any).urlId,
                    uniqueKey: tool.uniqueKey,
                    sl: tool.sl,
                    lastSource: tool.lastSource,
                    sources: tool.sources
                  });
                }

                // 为收藏工具准备参数，确保有正确的bindId
                let bindId = tool.bindId;
                let toolId = typeof tool.id === 'number' ? tool.id : undefined;

                // 如果是收藏工具且缺少bindId，尝试使用urlId或其他字段
                if (tool.lastSource === 'favorite' && !bindId) {
                  // 尝试从tool对象中获取其他可能的ID字段
                  bindId = (tool as any).urlId || (tool as any).bind_id || (tool as any).favoriteId;
                  console.log('收藏工具缺少bindId，尝试使用备用字段:', bindId);

                  // 如果还是没有bindId，但toolId存在，可能需要重新映射
                  if (!bindId && toolId) {
                    console.log('收藏工具仅toolId存在，将toolId作为bindId使用');
                    bindId = toolId;
                  }
                }

                // 使用新的常用工具专用跳转逻辑
                await handleFrequentToolClick({
                  toolId: toolId,
                  title: tool.title,
                  url: tool.url,
                  desc: tool.desc,
                  img: tool.img,
                  source: (tool.lastSource as 'homepage' | 'bookmark' | 'favorite') || 'homepage', // 使用工具的原始来源
                  bindId: bindId, // 收藏绑定ID（可能经过修复）
                  uniqueKey: tool.uniqueKey,
                  sl: tool.sl // 短地址
                }, e);

                console.log('点击常用工具:', tool.id, '来源:', tool.lastSource);
                onToolClick(tool.id);
              }}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 relative flex-shrink-0">
                <Image
                  src={getSafeImageSrc(tool)}
                  alt={tool.title || '工具图标'}
                  fill
                  sizes="(max-width: 640px) 20px, 24px"
                  className="rounded object-cover"
                  unoptimized
                  onError={() => handleImageError(tool.id)}
                />
              </div>
              <div className="ml-2 flex-1 min-w-0">
                <h3 className="font-medium text-xs sm:text-sm text-gray-900 truncate hover:text-[#39aba4]">
                  {tool.title}
                </h3>
              </div>
            </a>

            {/* 详情按钮 - 绝对定位在最右侧，参考SiteCard的实现 */}
            {tool.sl && (
              <div
                className="hidden sm:block absolute top-0 right-0 w-0 group-hover:w-4 h-full overflow-hidden transition-all duration-200 rounded-r-lg group"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // 根据源地址跳转到详情页面
                  window.open(`/site/${tool.sl}`, '_blank', 'noopener,noreferrer');
                }}
                title="查看详情"
              >
                <div className="h-full bg-gradient-to-r from-gray-100 via-gray-150 to-gray-200 hover:bg-gradient-to-r hover:from-[rgba(57,171,164,0.08)] hover:via-[rgba(57,171,164,0.12)] hover:to-[rgba(57,171,164,0.16)] cursor-pointer flex items-center justify-center rounded-r-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400 group-hover:text-[#39aba4] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FrequentTools;