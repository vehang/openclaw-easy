'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '@/components/Layout';
import CategoryTabs from '@/components/CategoryTabs';

import SiteCard from '@/components/SiteCard';
import { fetchToolsData } from '@/services/api';
import { ApiResponse } from '@/types/IndexToolList';
import { initDeviceId } from '@/utils/device';
import { useAsync } from '@/hooks/useAsync';
import { useAuth } from '@/hooks/useAuth';
import { useFrequentToolsSync } from '@/hooks/useFrequentToolsSync';
import { useFrequentTools } from '@/hooks/useFrequentTools';
import { getLocalData, getCloudCacheData, mergeFrequentToolsForDisplay } from '@/utils/frequentToolsManager';
import { USER_DATA_UPDATED_EVENT, STORAGE_KEYS } from '@/constants/storage';
import { slCacheManager } from '@/utils/slCacheManager';

export default function Home() {
  const [activeTabIndices, setActiveTabIndices] = useState<Record<number, number>>({});
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLoadTimeRef = useRef<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 添加登录状态跟踪，用于控制强制刷新
  const [shouldForceRefresh, setShouldForceRefresh] = useState(false);
  const lastAuthStateRef = useRef<boolean | null>(null);

  // 使用新的async hook
  const { data: categories, loading, error, execute: loadData } = useAsync<ApiResponse>(
    fetchToolsData,
    []
  );

  // 获取认证状态
  const { isAuthenticated } = useAuth();

  // 常用工具同步功能
  const {
    smartSync,
    syncing,
    syncError,
    aggregatedTools,
    smartRecoverDeviceData
  } = useFrequentToolsSync({
    autoSync: true,
    syncInterval: 30000 // 30秒自动同步一次
  });

  // 获取本地常用工具数据
  const { tools: localFrequentTools, refresh: refreshLocalTools } = useFrequentTools({
    limit: 24,
    autoRefresh: true  // 启用自动刷新，监听本地缓存变化
  });

  // 存储最终展示的工具数据
  const [displayTools, setDisplayTools] = useState<any[]>([]);

  // 监听 aggregatedTools 变化，刷新本地数据并计算合并数据
  useEffect(() => {
    if (aggregatedTools && aggregatedTools.length > 0) {
      console.log('🔥 [page.tsx] aggregatedTools 更新，数量:', aggregatedTools.length);
      refreshLocalTools();
    }
  }, [aggregatedTools, refreshLocalTools]);

  // 计算合并后的展示数据（静默更新）
  useEffect(() => {
    let result: any[] = [];

    // 有线上聚合数据：合并本地和线上数据
    if (aggregatedTools && aggregatedTools.length > 0) {
      console.log('==================== 【静默更新】线上数据返回，开始合并 ====================');
      console.log('📥 线上聚合数据数量:', aggregatedTools.length);
      console.log('📥 本地数据数量:', localFrequentTools.length);

      const toolMap = new Map<string, any>();

      // 记录合并详情
      const mergeDetails: Array<{
        title: string;
        onlineUv: number;
        localUv: number;
        totalUv: number;
        source: 'online' | 'local' | 'merged';
      }> = [];

      // 先放入线上数据
      aggregatedTools.forEach(tool => {
        // 统一使用 uniqueKey 作为主键，与 frequentToolsManager.ts 保持一致
        const key = tool.uniqueKey || tool.url || tool.id?.toString() || tool.sl || '';
        if (key) {
          toolMap.set(key, { ...tool });
          mergeDetails.push({
            title: tool.title,
            onlineUv: tool.un || 0,
            localUv: 0,
            totalUv: tool.un || 0,
            source: 'online'
          });
        }
      });

      // 累加本地数据的 UV，并补充本地独有的工具
      localFrequentTools.forEach(tool => {
        // 统一使用 uniqueKey 作为主键，与 frequentToolsManager.ts 保持一致
        const key = tool.uniqueKey || tool.url || tool.id?.toString() || tool.sl || '';
        if (key && toolMap.has(key)) {
          const existing = toolMap.get(key);
          const localUv = tool.un || 0;
          const onlineUv = existing.un || 0;
          existing.un = onlineUv + localUv;

          // 更新合并详情
          const detail = mergeDetails.find(d => d.title === existing.title);
          if (detail) {
            detail.localUv = localUv;
            detail.totalUv = onlineUv + localUv;
            detail.source = 'merged';
          }
        } else if (key) {
          toolMap.set(key, { ...tool });
          mergeDetails.push({
            title: tool.title,
            onlineUv: 0,
            localUv: tool.un || 0,
            totalUv: tool.un || 0,
            source: 'local'
          });
        }
      });

      result = Array.from(toolMap.values()).sort((a, b) => (b.un || 0) - (a.un || 0)).slice(0, 24);

      console.log('📊 合并后数量:', result.length);
      console.log('');

      // 使用排序后的 result 构建表格数据
      const tableData = result.map(tool => {
        const detail = mergeDetails.find(d => d.title === tool.title);
        return {
          '主键': tool.uniqueKey,
          '工具名称': tool.title,
          '线上UV': detail?.onlineUv ?? 0,
          '本地UV': detail?.localUv ?? 0,
          '总UV': tool.un ?? 0,
          '来源': detail?.source === 'online' ? '仅线上' :
                  detail?.source === 'local' ? '仅本地' : '线上+本地'
        };
      });
      console.table(tableData);
      console.log('==================== 【静默更新】合并完成 ====================');
    }
    // 没有线上数据：使用本地数据
    else if (localFrequentTools.length > 0) {
      console.log('📥 【静默更新】无线上数据，使用本地数据，数量:', localFrequentTools.length);
      result = [...localFrequentTools].sort((a, b) => (b.un || 0) - (a.un || 0)).slice(0, 24);
    }

    setDisplayTools(result);
  }, [aggregatedTools, localFrequentTools]);

  // 检查是否需要强制刷新（登录状态变化的第一次请求）
  const checkNeedForceRefresh = useCallback(() => {
    // 如果是第一次加载，不需要强制刷新
    if (lastAuthStateRef.current === null) {
      lastAuthStateRef.current = isAuthenticated;
      return false;
    }

    // 如果登录状态发生了变化，需要强制刷新
    if (lastAuthStateRef.current !== isAuthenticated) {
      console.log('检测到登录状态变化:', lastAuthStateRef.current ? '登录→退出' : '退出→登录', '，下次请求将强制刷新');
      lastAuthStateRef.current = isAuthenticated;
      return true;
    }

    return false;
  }, [isAuthenticated]);

  // 防抖的loadData函数，避免短时间内多次调用
  const debouncedLoadData = useCallback((forceRefresh?: boolean) => {
    const now = Date.now();

    // 如果距离上次加载时间少于2秒，则忽略此次请求
    if (now - lastLoadTimeRef.current < 2000) {
      return;
    }

    if (loadDataTimeoutRef.current) {
      clearTimeout(loadDataTimeoutRef.current);
    }

    loadDataTimeoutRef.current = setTimeout(() => {
      const needForceRefresh = forceRefresh || shouldForceRefresh;
      lastLoadTimeRef.current = Date.now();

      // 如果是强制刷新，重置标记
      if (shouldForceRefresh) {
        setShouldForceRefresh(false);
      }

      loadData(needForceRefresh);
    }, 300); // 300ms防抖
  }, [loadData, shouldForceRefresh]);

  // 【新增】首次加载时立即展示本地已有数据
  useEffect(() => {
    if (!isClient) return;

    console.log('🚀 [page.tsx] 首次加载，立即读取本地数据');

    // 立即读取并合并本地已有数据
    const initialTools = mergeFrequentToolsForDisplay(isAuthenticated);

    if (initialTools.length > 0) {
      setDisplayTools(initialTools.slice(0, 24));
      console.log('🚀 [page.tsx] 首次加载，展示本地数据，数量:', initialTools.length);
    } else {
      console.log('🚀 [page.tsx] 首次加载，本地无数据');
    }
  }, [isClient, isAuthenticated]);

  // 初始化常用工具同步逻辑
  const initializeFrequentToolsSync = useCallback(async () => {
    console.log('🔥 initializeFrequentToolsSync 被调用, isAuthenticated:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('用户未登录，跳过常用工具同步初始化');
      return;
    }

    console.log('🔥 开始初始化常用工具同步，准备调用smartSync...');
    // 直接调用smartSync，它会自动检查是否需要恢复和同步
    await smartSync();
    console.log('🔥 smartSync 调用完成');
  }, [isAuthenticated, smartSync]);


  useEffect(() => {
    // 首页加载时初始化设备ID
    initDeviceId();

    // 延迟初始化同步，让本地数据先展示出来
    const timer = setTimeout(() => {
      initializeFrequentToolsSync();
    }, 2000); // 延迟2秒，确保本地数据先展示

    return () => clearTimeout(timer);
  }, [initializeFrequentToolsSync]);

  // 统一处理各种数据更新事件
  useEffect(() => {
    if (!isClient) return;

    // 通用的数据重新加载处理函数
    const handleDataReload = (eventType: string, forceRefresh = false) => {
      // 检查是否需要强制刷新
      const needForceRefresh = forceRefresh || checkNeedForceRefresh();
      if (needForceRefresh) {
        setShouldForceRefresh(true);
      }
      debouncedLoadData(forceRefresh);
    };

    const handleUserDataUpdate = () => handleDataReload('用户数据更新');
    const handleTokenExpired = () => handleDataReload('登录过期', true);

    const handleLoginStateChanged = (event: CustomEvent) => {
      const { type, isAuthenticated: newAuthState } = event.detail;
      console.log(`首页检测到登录状态变化事件: ${type}, 新状态: ${newAuthState ? '已登录' : '未登录'}`);
      handleDataReload('登录状态变化', true);
    };

    const handleCacheCleared = (event: CustomEvent) => {
      const { eventType, timestamp } = event.detail;
      console.log(`首页检测到缓存清理完成事件: ${eventType}, 时间戳: ${timestamp}`);
      handleDataReload('缓存清理完成', true);
    };

    // 统一添加事件监听器
    window.addEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate);
    window.addEventListener(STORAGE_KEYS.TOKEN_EXPIRED_EVENT, handleTokenExpired);
    window.addEventListener('LOGIN_STATE_CHANGED', handleLoginStateChanged as EventListener);
    window.addEventListener('CACHE_CLEARED', handleCacheCleared as EventListener);

    return () => {
      window.removeEventListener(USER_DATA_UPDATED_EVENT, handleUserDataUpdate);
      window.removeEventListener(STORAGE_KEYS.TOKEN_EXPIRED_EVENT, handleTokenExpired);
      window.removeEventListener('LOGIN_STATE_CHANGED', handleLoginStateChanged as EventListener);
      window.removeEventListener('CACHE_CLEARED', handleCacheCleared as EventListener);

      // 清理防抖定时器
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
    };
  }, [debouncedLoadData, checkNeedForceRefresh, isClient]);

  // 监听认证状态变化，但添加防抖避免频繁触发
  useEffect(() => {
    // 检查是否需要强制刷新
    const needForceRefresh = checkNeedForceRefresh();
    if (needForceRefresh) {
      setShouldForceRefresh(true);
    }
    debouncedLoadData();
  }, [isAuthenticated, debouncedLoadData, checkNeedForceRefresh]);

  // 当数据加载成功时，初始化标签索引和预加载sl缓存
  useEffect(() => {
    if (categories && isClient) {
      // 预加载所有工具的sl字段到缓存（一次性操作，后续访问极快）
      const startTime = Date.now();
      slCacheManager.preloadSLs(categories);
      const cacheStats = slCacheManager.getStats();
      console.log(`[首页] SL缓存预加载完成，耗时 ${Date.now() - startTime}ms，缓存大小: ${cacheStats.size}`);

      const initialActiveIndices: Record<number, number> = {};
      categories.forEach((_, index) => {
        initialActiveIndices[index] = 0;
      });
      setActiveTabIndices(initialActiveIndices);

      // 检查是否有待切换的分组
      const pendingGroupSwitch = sessionStorage.getItem('pendingGroupSwitch');
      if (pendingGroupSwitch) {
        try {
          const { categoryIndex, groupIndex } = JSON.parse(pendingGroupSwitch);

          // 验证索引有效性
          if (categoryIndex >= 0 && categoryIndex < categories.length &&
            groupIndex >= 0 && groupIndex < categories[categoryIndex].glist.length) {

            // 立即切换到指定分组
            setActiveTabIndices(prev => ({
              ...prev,
              [categoryIndex]: groupIndex
            }));

            // 延迟滚动，确保页面渲染完成
            setTimeout(() => {
              // 滚动到对应分类
              const categoryId = `category-${categoryIndex}-${categories[categoryIndex].cname.replace(/\s+/g, '-').toLowerCase()}`;
              const element = document.getElementById(categoryId);
              if (element) {
                const headerElement = document.querySelector('header');
                const headerHeight = headerElement ? headerElement.getBoundingClientRect().height : 120;

                const elementRect = element.getBoundingClientRect();
                const currentScrollY = window.scrollY;

                // 检查是否是第一个分类，需要考虑常用工具区域
                const isFirstCategory = categoryIndex === 0;
                let additionalOffset = 0;

                if (isFirstCategory) {
                  const frequentToolsElement = document.getElementById('frequent-tools-section');
                  if (frequentToolsElement) {
                    const rect = frequentToolsElement.getBoundingClientRect();
                    const styles = window.getComputedStyle(frequentToolsElement);
                    const marginBottom = parseFloat(styles.marginBottom) || 24;
                    additionalOffset = rect.height + marginBottom;
                  }
                }

                let targetScrollY = currentScrollY + elementRect.top - headerHeight - 20 - additionalOffset;
                targetScrollY = Math.max(0, targetScrollY);

                window.scrollTo({
                  top: targetScrollY,
                  behavior: 'smooth'
                });
              }
            }, 100);
          }

          // 清除 sessionStorage 中的数据
          sessionStorage.removeItem('pendingGroupSwitch');
        } catch (error) {
          console.error('解析待切换分组信息失败:', error);
          sessionStorage.removeItem('pendingGroupSwitch');
        }
      }
    }
  }, [categories, isClient]);

  const handleTabChange = useCallback((categoryIndex: number, tabIndex: number) => {
    // 立即更新状态，不等待任何异步操作
    setActiveTabIndices(prev => ({
      ...prev,
      [categoryIndex]: tabIndex
    }));
  }, []);

  // 监听分组切换事件
  useEffect(() => {
    if (!isClient) return;

    const handleGroupSwitch = (event: CustomEvent) => {
      const { categoryIndex, groupIndex } = event.detail;

      // 验证索引有效性
      if (categories && categoryIndex >= 0 && categoryIndex < categories.length &&
        groupIndex >= 0 && groupIndex < categories[categoryIndex].glist.length) {

        // 立即切换到指定分组，无延迟
        setActiveTabIndices(prev => ({
          ...prev,
          [categoryIndex]: groupIndex
        }));
      }
    };

    window.addEventListener('SWITCH_TO_GROUP', handleGroupSwitch as EventListener);

    return () => {
      window.removeEventListener('SWITCH_TO_GROUP', handleGroupSwitch as EventListener);
    };
  }, [categories, isClient]);

  const handleRetry = () => {
    // 手动重试时强制刷新缓存
    loadData(true); // 传入forceRefresh=true强制刷新缓存
  };

  return (
    <Layout
      categories={loading ? [] : (categories || [])}
      isLoading={loading}
      hasError={!!error}
      onRetry={handleRetry}
      showFrequentTools={true}
      useSidebarMargin={!loading && !error && !!categories && categories.length > 0}
      aggregatedTools={displayTools}
    >
      {(categories || []).map((category, categoryIndex) => {
        const categoryId = `category-${categoryIndex}-${category.cname.replace(/\s+/g, '-').toLowerCase()}`;
        const tabNames = category.glist.map(group => group.groupName);
        const activeTabIndex = activeTabIndices[categoryIndex] || 0;
        const currentTools = category.glist[activeTabIndex]?.tools || [];

        return (
          <React.Fragment key={categoryId}>
            <section
              id={categoryId}
              className="mb-0 pb-8 bg-white rounded-lg overflow-hidden"
            >
              <CategoryTabs
                categories={tabNames}
                onTabChange={(index) => handleTabChange(categoryIndex, index)}
                activeTab={activeTabIndex}
                viewAllHref={`/tools/${category.cid}/all`}
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 px-2 sm:px-4 md:px-6">
                {currentTools.map((tool, toolIndex) => (
                  <SiteCard
                    key={toolIndex}
                    tool={tool}
                  />
                ))}
              </div>
            </section>

            {/* 添加全宽灰色间隔区域，最后一个分类不添加 */}
            {categoryIndex < (categories || []).length - 1 && (
              <div className="h-4 sm:h-6 bg-gray-100 my-2 rounded-lg -mx-2 sm:-mx-4 md:-mx-6 lg:-mx-8">
                <div className="w-full h-full"></div>
              </div>
            )}
          </React.Fragment>
        );
      })}

          </Layout>
  );
}
