import { useState, useEffect, useCallback } from 'react';
import { Tool } from '@/types/IndexToolList';
import {
  addToFrequentTools,
  getFrequentTools,
  refreshFrequentTools,
  clearFrequentTools,
  removeFrequentTool,
  getFrequentToolsStats,
  createFrequentToolsListener,
  STORAGE_TOP_NUM,
  ToolInput
} from '@/utils/frequentToolsManager';

export interface UseFrequentToolsOptions {
  limit?: number;
  autoRefresh?: boolean;
}

export interface FrequentToolsStats {
  totalTools: number;
  totalUsage: number;
  topTool: Tool | null;
  averageUsage: number;
}

export const useFrequentTools = (options: UseFrequentToolsOptions = {}) => {
  const { limit = STORAGE_TOP_NUM, autoRefresh = true } = options;

  // 确保限制永远不会超过24，防止显示数量超过限制
  const safeLimit = Math.min(limit, STORAGE_TOP_NUM);
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FrequentToolsStats>({
    totalTools: 0,
    totalUsage: 0,
    topTool: null,
    averageUsage: 0
  });

  // 刷新工具列表和统计信息
  const refreshTools = useCallback(() => {
    const updatedTools = getFrequentTools(safeLimit);
    const updatedStats = getFrequentToolsStats();

    setTools(updatedTools);
    setStats(updatedStats);
    setLoading(false);
  }, [safeLimit]);

  // 添加工具到常用工具
  const addTool = useCallback((toolInput: ToolInput) => {
    addToFrequentTools(toolInput);
    if (autoRefresh) {
      refreshTools();
    }
  }, [autoRefresh, refreshTools]);

  // 删除特定工具
  const removeTool = useCallback((url: string) => {
    removeFrequentTool(url);
    if (autoRefresh) {
      refreshTools();
    }
  }, [autoRefresh, refreshTools]);

  // 清除所有常用工具
  const clearTools = useCallback(() => {
    clearFrequentTools();
    if (autoRefresh) {
      refreshTools();
    }
  }, [autoRefresh, refreshTools]);

  // 手动刷新
  const refresh = useCallback(() => {
    refreshTools();
  }, [refreshTools]);

  // 初始化和监听变化
  useEffect(() => {
    // 初始加载
    refreshTools();

    // 如果启用自动刷新，监听变化
    if (autoRefresh) {
      const cleanup = createFrequentToolsListener((updatedTools) => {
        setTools(updatedTools);
        setStats(getFrequentToolsStats());
      }, safeLimit);

      return cleanup;
    }
  }, [safeLimit, autoRefresh, refreshTools]);

  return {
    // 数据
    tools,
    stats,
    loading,
    
    // 操作方法
    addTool,
    removeTool,
    clearTools,
    refresh,
    
    // 便捷方法
    isEmpty: tools.length === 0,
    count: tools.length,
    
    // 快速添加方法（适用于不同数据格式）
    addFromUrl: useCallback((url: string, title?: string) => {
      addTool({ url, title: title || url, source: 'homepage' });
    }, [addTool]),
    
    addFromBookmark: useCallback((bookmark: { id: string; title: string; url?: string }) => {
      if (bookmark.url) {
        addTool({
          title: bookmark.title,
          url: bookmark.url,
          id: bookmark.id,
          source: 'bookmark'
        });
      }
    }, [addTool]),
    
    addFromCollection: useCallback((item: { urlId: number; title: string; url: string; msg?: string; img?: string }) => {
      addTool({
        title: item.title,
        url: item.url,
        id: item.urlId,
        desc: item.msg,
        img: item.img,
        source: 'favorite'
      });
    }, [addTool])
  };
}; 