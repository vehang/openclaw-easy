import { useState, useCallback, useRef } from 'react';
import { searchManager } from '@/services/search/SearchManager';
import { SearchResult, UseSearchOptions, SearchHookResult } from '@/types/search';

export function useSearch(options: UseSearchOptions = {}): SearchHookResult {
  const {
    debounceMs = 300, // 基于讨论确认的防抖时间
    enabled = true,
    limit = 10,
    sortBy = 'score',
    source = 'home' // 默认搜索首页数据
  } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 防抖定时器引用
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 当前搜索的AbortController引用
  const currentControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string, searchSource?: string) => {
    if (!enabled || !query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置防抖
    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        // 取消之前的搜索
        if (currentControllerRef.current) {
          currentControllerRef.current.abort();
        }

        // 创建新的AbortController
        const controller = new AbortController();
        currentControllerRef.current = controller;

        // 使用指定的搜索源或默认源
        const finalSource = searchSource || source || searchManager.getCurrentSource();
        const searchResults = await searchManager.search(query, finalSource, {
          limit,
          sortBy,
          signal: controller.signal
        });

        // 检查搜索是否被取消
        if (!controller.signal.aborted) {
          setResults(searchResults);
        }
      } catch (err) {
        if (!currentControllerRef.current?.signal.aborted) {
          const error = err instanceof Error ? err : new Error('搜索失败');
          setError(error);
          setResults([]);
        }
      } finally {
        if (!currentControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, debounceMs);
  }, [enabled, limit, sortBy, debounceMs, source]);

  const cancel = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (currentControllerRef.current) {
      currentControllerRef.current.abort();
      currentControllerRef.current = null;
    }

    setLoading(false);
  }, []);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    setResults([]);
    setError(null);
    setLoading(false);
  }, []);

  // 清理函数
  const cleanup = useCallback(() => {
    cancel();
    clear();
  }, [cancel, clear]);

  return {
    results,
    loading,
    error,
    search,
    cancel,
    clear
  };
}